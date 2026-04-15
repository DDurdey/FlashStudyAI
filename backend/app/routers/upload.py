from typing import List
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.dependencies import get_blob_service, get_cosmos_service, get_doc_service, get_openai_service
from app.models.flashcard import DeckDocument, Flashcard, UploadResponse

router = APIRouter(prefix="/api/upload", tags=["upload"])

blob_service = get_blob_service()
doc_service = get_doc_service()
openai_service = get_openai_service()
cosmos_service = get_cosmos_service()

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024


@router.post("", response_model=UploadResponse)
async def upload_file(
	files: List[UploadFile] = File(...),
	deck_name: str = Form("Untitled Deck"),
	card_count: int = Form(10),
) -> UploadResponse:
	if not files:
		raise HTTPException(status_code=400, detail="At least one file is required.")

	if card_count < 3 or card_count > 100:
		raise HTTPException(status_code=400, detail="card_count must be between 3 and 100.")

	all_flashcards: List[Flashcard] = []
	total_chars = 0
	first_blob_url: str | None = None
	first_excerpt: str | None = None

	for file in files:
		if not file.filename:
			raise HTTPException(status_code=400, detail="Filename is required for all files.")

		suffix = "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""
		if suffix not in ALLOWED_EXTENSIONS:
			raise HTTPException(
				status_code=400,
				detail=f"{file.filename}: only PDF, DOCX, and TXT files are supported.",
			)

		upload_result = await blob_service.upload_file(file)
		if len(upload_result["content"]) > MAX_UPLOAD_SIZE_BYTES:
			raise HTTPException(status_code=413, detail=f"{file.filename}: file too large. Max is 15 MB.")

		if first_blob_url is None:
			first_blob_url = upload_result["blob_url"]

		extracted_text = doc_service.extract_text(upload_result["content"], file.filename)
		if not extracted_text.strip():
			raise HTTPException(
				status_code=422,
				detail=f"Could not extract readable text from {file.filename}.",
			)

		if first_excerpt is None:
			first_excerpt = extracted_text[:500]

		total_chars += len(extracted_text)

		cards = openai_service.generate_flashcards(
			extracted_text,
			card_count,
			source_label=file.filename,
		)

		# Tag each card with its source file so the frontend can group/filter by file.
		for card in cards:
			all_flashcards.append(
				Flashcard(
					question=card.question,
					answer=card.answer,
					difficulty=card.difficulty,
					topic=card.topic,
					source_file=file.filename,
				)
			)

	source_name = files[0].filename if len(files) == 1 else f"{len(files)} files"

	deck = DeckDocument(
		id=str(uuid4()),
		deck_name=deck_name,
		source_file_name=source_name,
		blob_url=first_blob_url,
		source_text_excerpt=first_excerpt,
		flashcards=all_flashcards,
	)
	saved = cosmos_service.create_deck(deck)

	return UploadResponse(deck=saved, extracted_characters=total_chars)
