from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.dependencies import get_blob_service, get_cosmos_service, get_doc_service, get_openai_service
from app.models.flashcard import DeckDocument, UploadResponse

router = APIRouter(prefix="/api/upload", tags=["upload"])

blob_service = get_blob_service()
doc_service = get_doc_service()
openai_service = get_openai_service()
cosmos_service = get_cosmos_service()

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024


@router.post("", response_model=UploadResponse)
async def upload_file(
	file: UploadFile = File(...),
	deck_name: str = Form("Untitled Deck"),
	card_count: int = Form(10),
) -> UploadResponse:
	if not file.filename:
		raise HTTPException(status_code=400, detail="Filename is required.")

	suffix = "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""
	if suffix not in ALLOWED_EXTENSIONS:
		raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are supported.")

	if card_count < 3 or card_count > 30:
		raise HTTPException(status_code=400, detail="card_count must be between 3 and 30.")

	upload_result = await blob_service.upload_file(file)
	if len(upload_result["content"]) > MAX_UPLOAD_SIZE_BYTES:
		raise HTTPException(status_code=413, detail="File too large. Max upload size is 15MB.")

	extracted_text = doc_service.extract_text(upload_result["content"], file.filename)

	if not extracted_text.strip():
		raise HTTPException(status_code=422, detail="Could not extract readable text from the uploaded file.")

	flashcards = openai_service.generate_flashcards(
		extracted_text,
		card_count,
		source_label=file.filename,
	)

	deck = DeckDocument(
		id=str(uuid4()),
		deck_name=deck_name,
		source_file_name=file.filename,
		blob_url=upload_result["blob_url"],
		source_text_excerpt=extracted_text[:500],
		flashcards=flashcards,
	)
	saved = cosmos_service.create_deck(deck)

	return UploadResponse(deck=saved, extracted_characters=len(extracted_text))
