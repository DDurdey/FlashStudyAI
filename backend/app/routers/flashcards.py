import csv
from io import StringIO
from collections import defaultdict
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.dependencies import get_cosmos_service, get_openai_service
from app.models.flashcard import DeckCreateRequest, DeckDocument, QuizAnswerRequest, QuizAnswerResponse, TopicGroup

router = APIRouter(prefix="/api/flashcards", tags=["flashcards"])

cosmos_service = get_cosmos_service()
openai_service = get_openai_service()


@router.get("", response_model=list[DeckDocument])
def list_decks() -> list[DeckDocument]:
	return cosmos_service.list_decks()


@router.post("/from-text", response_model=DeckDocument)
def create_deck_from_text(payload: DeckCreateRequest) -> DeckDocument:
	flashcards = openai_service.generate_flashcards(
		payload.source_text,
		payload.card_count,
		source_label=payload.deck_name,
	)
	deck = DeckDocument(
		id=str(uuid4()),
		deck_name=payload.deck_name,
		source_text_excerpt=payload.source_text[:500],
		flashcards=flashcards,
	)
	return cosmos_service.create_deck(deck)


@router.get("/{deck_id}", response_model=DeckDocument)
def get_deck(deck_id: str) -> DeckDocument:
	deck = cosmos_service.get_deck(deck_id)
	if deck is None:
		raise HTTPException(status_code=404, detail="Deck not found")
	return deck


@router.delete("/{deck_id}")
def delete_deck(deck_id: str) -> dict:
	deleted = cosmos_service.delete_deck(deck_id)
	if not deleted:
		raise HTTPException(status_code=404, detail="Deck not found")
	return {"deleted": True, "deck_id": deck_id}


@router.get("/{deck_id}/export.csv")
def export_deck_csv(deck_id: str) -> StreamingResponse:
	deck = cosmos_service.get_deck(deck_id)
	if deck is None:
		raise HTTPException(status_code=404, detail="Deck not found")

	buffer = StringIO()
	writer = csv.writer(buffer)
	writer.writerow(["question", "answer", "difficulty", "topic"])
	for card in deck.flashcards:
		writer.writerow([card.question, card.answer, card.difficulty.value, card.topic])
	buffer.seek(0)

	return StreamingResponse(
		iter([buffer.getvalue()]),
		media_type="text/csv",
		headers={"Content-Disposition": f"attachment; filename={deck_id}.csv"},
	)


@router.post("/{deck_id}/quiz", response_model=QuizAnswerResponse)
def grade_quiz_answer(deck_id: str, payload: QuizAnswerRequest) -> QuizAnswerResponse:
	deck = cosmos_service.get_deck(deck_id)
	if deck is None:
		raise HTTPException(status_code=404, detail="Deck not found")

	if payload.card_index >= len(deck.flashcards):
		raise HTTPException(status_code=400, detail="card_index out of range")

	card = deck.flashcards[payload.card_index]
	return openai_service.evaluate_answer(
		question=card.question,
		expected_answer=card.answer,
		student_answer=payload.student_answer,
	)


@router.get("/{deck_id}/topics", response_model=list[TopicGroup])
def get_deck_topics(deck_id: str) -> list[TopicGroup]:
	deck = cosmos_service.get_deck(deck_id)
	if deck is None:
		raise HTTPException(status_code=404, detail="Deck not found")

	buckets: dict[str, list] = defaultdict(list)
	for card in deck.flashcards:
		buckets[card.topic].append(card)

	groups = [
		TopicGroup(topic=topic, count=len(cards), flashcards=cards)
		for topic, cards in buckets.items()
	]
	groups.sort(key=lambda group: (-group.count, group.topic))
	return groups
