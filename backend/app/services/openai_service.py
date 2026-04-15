import json
from typing import List

from app.config import get_settings
from app.models.flashcard import Difficulty, Flashcard, QuizAnswerResponse

try:
	from openai import AzureOpenAI
except ImportError:  # pragma: no cover
	AzureOpenAI = None


class OpenAIFlashcardService:
	def __init__(self) -> None:
		settings = get_settings()
		self._deployment = settings.azure_openai_deployment
		self._client = None

		if (
			settings.azure_openai_endpoint
			and settings.azure_openai_key
			and AzureOpenAI is not None
		):
			try:
				self._client = AzureOpenAI(
					api_key=settings.azure_openai_key,
					api_version=settings.azure_openai_api_version,
					azure_endpoint=settings.azure_openai_endpoint,
				)
			except Exception:
				# Fall back to local generation when OpenAI client cannot initialize.
				self._client = None

	def generate_flashcards(self, source_text: str, card_count: int, source_label: str | None = None) -> List[Flashcard]:
		if self._client is None:
			return self._fallback_generate(source_text, card_count, source_label)

		system_prompt = (
			"You generate high quality study flashcards in strict JSON. "
			"Output must be valid JSON object containing a single key named flashcards. "
			"Each flashcard must include: question, answer, difficulty, topic. "
			"Difficulty must be exactly one of Easy, Medium, Hard. "
			"topic should be short (2-4 words), and topics must come from only 2 to 5 high-level document topics. "
			"Do not create a unique topic for each card. "
			"Avoid duplicate questions and avoid trivia."
		)

		user_prompt = (
			f"Create {card_count} flashcards from the text below. Focus on core concepts, definitions, "
			"cause/effect, and exam-relevant details. Keep answers concise and correct.\n\n"
			f"SOURCE LABEL: {source_label or 'Uploaded Document'}\n"
			f"TEXT:\n{source_text[:12000]}"
		)

		try:
			response = self._client.chat.completions.create(
				model=self._deployment,
				temperature=0.3,
				response_format={"type": "json_object"},
				messages=[
					{"role": "system", "content": system_prompt},
					{
						"role": "user",
						"content": (
							f"Respond with JSON object: {{\"flashcards\": [ ... ]}}.\n{user_prompt}"
						),
					},
				],
			)

			payload = json.loads(response.choices[0].message.content)
			cards = payload.get("flashcards", [])
			parsed_cards = [
				self._clean_card(
					Flashcard(
						question=item["question"],
						answer=item["answer"],
						difficulty=Difficulty(item["difficulty"]),
						topic=item.get("topic") or "General",
					)
				)
				for item in cards[:card_count]
			]
			if not parsed_cards:
				return self._fallback_generate(source_text, card_count, source_label)

			# Top up to requested card count with deterministic fallback if needed.
			if len(parsed_cards) < card_count:
				fallback_cards = self._fallback_generate(source_text, card_count, source_label)
				for card in fallback_cards:
					if len(parsed_cards) >= card_count:
						break
					parsed_cards.append(self._clean_card(card))

			return self._normalize_topics(parsed_cards[:card_count], source_label)
		except Exception:
			return self._fallback_generate(source_text, card_count, source_label)

	def evaluate_answer(self, question: str, expected_answer: str, student_answer: str) -> QuizAnswerResponse:
		if self._client is None:
			return self._fallback_evaluate(expected_answer, student_answer)

		try:
			response = self._client.chat.completions.create(
				model=self._deployment,
				temperature=0.2,
				response_format={"type": "json_object"},
				messages=[
					{
						"role": "system",
						"content": (
							"You grade a student's flashcard answer. Return JSON with keys: "
							"score (0-100), verdict (Correct/Partially Correct/Incorrect), feedback."
						),
					},
					{
						"role": "user",
						"content": (
							f"Question: {question}\nExpected answer: {expected_answer}\n"
							f"Student answer: {student_answer}"
						),
					},
				],
			)
			result = json.loads(response.choices[0].message.content)
			return QuizAnswerResponse(**result)
		except Exception:
			return self._fallback_evaluate(expected_answer, student_answer)

	def _fallback_generate(self, source_text: str, card_count: int, source_label: str | None = None) -> List[Flashcard]:
		sentences = [segment.strip() for segment in source_text.replace("\n", " ").split(".") if segment.strip()]
		document_topic = self._derive_document_topic(source_label, source_text)
		if not sentences:
			return [
				self._clean_card(Flashcard(
					question="What is the main topic of the uploaded content?",
					answer="No readable text was extracted from the file.",
					difficulty=Difficulty.easy,
					topic=document_topic,
				))
			]

		cards: List[Flashcard] = []
		for index in range(min(card_count, len(sentences))):
			sentence = sentences[index]
			cards.append(
				self._clean_card(Flashcard(
					question=f"Explain this concept in your own words: {sentence[:80]}?",
					answer=sentence,
					difficulty=[Difficulty.easy, Difficulty.medium, Difficulty.hard][index % 3],
					topic=document_topic,
				))
			)
		return self._normalize_topics(cards, source_label)

	def _derive_document_topic(self, source_label: str | None, source_text: str) -> str:
		if source_label:
			clean = source_label.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").strip()
			if clean:
				words = [word.capitalize() for word in clean.split()[:4]]
				if words:
					return " ".join(words)

		fallback_words = [
			word.strip(",;:()[]{}\"").capitalize()
			for word in source_text.split()
			if len(word) > 4
		][:3]
		if fallback_words:
			return " ".join(fallback_words)
		return "Uploaded Document"

	def _normalize_topics(self, cards: List[Flashcard], source_label: str | None = None) -> List[Flashcard]:
		if not cards:
			return cards

		normalized = [self._clean_card(card) for card in cards]

		if source_label:
			resolved_topic = self._derive_document_topic(source_label, "")
		else:
			counts: dict[str, int] = {}
			for card in normalized:
				counts[card.topic] = counts.get(card.topic, 0) + 1
			resolved_topic = max(counts.items(), key=lambda item: item[1])[0] if counts else "Uploaded Document"

		return [
			Flashcard(
				question=card.question,
				answer=card.answer,
				difficulty=card.difficulty,
				topic=resolved_topic,
			)
			for card in normalized
		]

	def _clean_card(self, card: Flashcard) -> Flashcard:
		question = " ".join(card.question.split()).strip()
		answer = " ".join(card.answer.split()).strip()
		topic = " ".join(card.topic.split()).strip().title() or "General"

		if not question.endswith("?"):
			question = f"{question.rstrip('.!')}?"

		if len(topic) > 60:
			topic = topic[:60].strip()

		return Flashcard(
			question=question,
			answer=answer,
			difficulty=card.difficulty,
			topic=topic,
		)

	def _fallback_evaluate(self, expected_answer: str, student_answer: str) -> QuizAnswerResponse:
		expected_tokens = {token.lower() for token in expected_answer.split() if len(token) > 3}
		student_tokens = {token.lower() for token in student_answer.split() if len(token) > 3}

		if not expected_tokens:
			return QuizAnswerResponse(score=50, verdict="Partially Correct", feedback="Reference answer is too short to grade reliably.")

		overlap = len(expected_tokens.intersection(student_tokens)) / len(expected_tokens)
		if overlap >= 0.65:
			return QuizAnswerResponse(score=90, verdict="Correct", feedback="Strong answer covering key points.")
		if overlap >= 0.35:
			return QuizAnswerResponse(score=65, verdict="Partially Correct", feedback="Good start, but include more key terms and detail.")
		return QuizAnswerResponse(score=30, verdict="Incorrect", feedback="Answer misses core concepts from the expected response.")
