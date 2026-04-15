from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class Difficulty(str, Enum):
	easy = "Easy"
	medium = "Medium"
	hard = "Hard"


class Flashcard(BaseModel):
	question: str = Field(..., min_length=3)
	answer: str = Field(..., min_length=1)
	difficulty: Difficulty
	topic: str = Field(default="General", min_length=2, max_length=60)
	source_file: Optional[str] = None


class DeckCreateRequest(BaseModel):
	deck_name: str = Field(..., min_length=2, max_length=120)
	source_text: str = Field(..., min_length=20)
	card_count: int = Field(default=10, ge=3, le=100)


class DeckDocument(BaseModel):
	id: str
	deck_name: str
	source_file_name: Optional[str] = None
	blob_url: Optional[str] = None
	source_text_excerpt: Optional[str] = None
	flashcards: List[Flashcard]
	created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class QuizAnswerRequest(BaseModel):
	card_index: int = Field(..., ge=0)
	student_answer: str = Field(..., min_length=1)


class QuizAnswerResponse(BaseModel):
	score: int = Field(..., ge=0, le=100)
	verdict: str
	feedback: str


class UploadResponse(BaseModel):
	deck: DeckDocument
	extracted_characters: int


class TopicGroup(BaseModel):
	topic: str
	count: int = Field(..., ge=1)
	flashcards: List[Flashcard]
