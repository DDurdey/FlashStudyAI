from functools import lru_cache

from app.services.blob_service import BlobStorageService
from app.services.cosmos_service import CosmosDeckService
from app.services.doc_intelligence import DocumentIntelligenceService
from app.services.openai_service import OpenAIFlashcardService


@lru_cache
def get_blob_service() -> BlobStorageService:
    return BlobStorageService()


@lru_cache
def get_doc_service() -> DocumentIntelligenceService:
    return DocumentIntelligenceService()


@lru_cache
def get_openai_service() -> OpenAIFlashcardService:
    return OpenAIFlashcardService()


@lru_cache
def get_cosmos_service() -> CosmosDeckService:
    return CosmosDeckService()