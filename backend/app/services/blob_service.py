from io import BytesIO
from pathlib import Path
from tempfile import gettempdir
from uuid import uuid4

from fastapi import UploadFile

from app.config import get_settings

try:
	from azure.storage.blob import BlobServiceClient
except ImportError:  # pragma: no cover
	BlobServiceClient = None


class BlobStorageService:
	def __init__(self) -> None:
		self.settings = get_settings()
		self._local_storage_dir = Path(gettempdir()) / "flashstudy_uploads"
		self._local_storage_dir.mkdir(parents=True, exist_ok=True)

		self._client = None
		if self.settings.azure_blob_connection_string and BlobServiceClient is not None:
			self._client = BlobServiceClient.from_connection_string(
				self.settings.azure_blob_connection_string
			)
			self._container = self.settings.azure_blob_container
			container_client = self._client.get_container_client(self._container)
			if not container_client.exists():
				container_client.create_container()

	async def upload_file(self, upload_file: UploadFile) -> dict:
		file_bytes = await upload_file.read()
		blob_name = f"{uuid4()}-{upload_file.filename}"

		if self._client is not None:
			blob_client = self._client.get_blob_client(
				container=self.settings.azure_blob_container, blob=blob_name
			)
			blob_client.upload_blob(BytesIO(file_bytes), overwrite=True)
			return {
				"blob_name": blob_name,
				"blob_url": blob_client.url,
				"content": file_bytes,
			}

		local_file = self._local_storage_dir / blob_name
		local_file.write_bytes(file_bytes)
		return {
			"blob_name": blob_name,
			"blob_url": str(local_file),
			"content": file_bytes,
		}
