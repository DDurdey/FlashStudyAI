from io import BytesIO

from app.config import get_settings

try:
	from azure.ai.formrecognizer import DocumentAnalysisClient
	from azure.core.credentials import AzureKeyCredential
except ImportError:  # pragma: no cover
	DocumentAnalysisClient = None
	AzureKeyCredential = None


class DocumentIntelligenceService:
	MAX_EXTRACTED_CHARS = 20000

	def __init__(self) -> None:
		settings = get_settings()
		self._client = None

		if (
			settings.azure_doc_intel_endpoint
			and settings.azure_doc_intel_key
			and DocumentAnalysisClient is not None
			and AzureKeyCredential is not None
		):
			self._client = DocumentAnalysisClient(
				endpoint=settings.azure_doc_intel_endpoint,
				credential=AzureKeyCredential(settings.azure_doc_intel_key),
			)

	def extract_text(self, content: bytes, filename: str) -> str:
		if self._client is not None:
			poller = self._client.begin_analyze_document("prebuilt-read", content)
			result = poller.result()
			text = "\n".join(line.content for page in result.pages for line in page.lines)
			return self._postprocess_text(text)

		return self._postprocess_text(self._fallback_extract_text(content, filename))

	def _fallback_extract_text(self, content: bytes, filename: str) -> str:
		lower_name = filename.lower()
		if lower_name.endswith(".txt"):
			return content.decode("utf-8", errors="ignore")

		if lower_name.endswith(".pdf"):
			try:
				from pypdf import PdfReader

				reader = PdfReader(BytesIO(content))
				return "\n".join((page.extract_text() or "") for page in reader.pages)
			except Exception:
				return ""

		if lower_name.endswith(".docx"):
			try:
				from docx import Document

				doc = Document(BytesIO(content))
				return "\n".join(paragraph.text for paragraph in doc.paragraphs)
			except Exception:
				return ""

		return content.decode("utf-8", errors="ignore")

	def _postprocess_text(self, text: str) -> str:
		cleaned = text.replace("\x00", " ")
		cleaned = "\n".join(line.strip() for line in cleaned.splitlines() if line.strip())
		if len(cleaned) > self.MAX_EXTRACTED_CHARS:
			cleaned = cleaned[: self.MAX_EXTRACTED_CHARS]
		return cleaned
