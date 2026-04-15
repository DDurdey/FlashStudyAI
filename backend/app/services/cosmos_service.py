from typing import Dict, List, Optional

from app.config import get_settings
from app.models.flashcard import DeckDocument

try:
	from azure.cosmos import CosmosClient, PartitionKey
except ImportError:  # pragma: no cover
	CosmosClient = None
	PartitionKey = None


class CosmosDeckService:
	def __init__(self) -> None:
		settings = get_settings()
		self._container = None
		self._memory_store: Dict[str, DeckDocument] = {}

		if CosmosClient is None or PartitionKey is None:
			return

		if settings.cosmos_connection_string:
			client = CosmosClient.from_connection_string(settings.cosmos_connection_string)
		elif settings.cosmos_endpoint and settings.cosmos_key:
			client = CosmosClient(settings.cosmos_endpoint, settings.cosmos_key)
		else:
			return

		if client is not None:
			database = client.create_database_if_not_exists(id=settings.cosmos_database)
			self._container = database.create_container_if_not_exists(
				id=settings.cosmos_container,
				partition_key=PartitionKey(path="/id"),
				offer_throughput=400,
			)

	def create_deck(self, deck: DeckDocument) -> DeckDocument:
		if self._container is not None:
			created = self._container.create_item(body=deck.model_dump())
			return DeckDocument(**created)

		self._memory_store[deck.id] = deck
		return deck

	def list_decks(self) -> List[DeckDocument]:
		if self._container is not None:
			items = self._container.query_items("SELECT * FROM c", enable_cross_partition_query=True)
			return [DeckDocument(**item) for item in items]

		return list(self._memory_store.values())

	def get_deck(self, deck_id: str) -> Optional[DeckDocument]:
		if self._container is not None:
			try:
				items = list(
					self._container.query_items(
						query="SELECT * FROM c WHERE c.id = @id",
						parameters=[{"name": "@id", "value": deck_id}],
						enable_cross_partition_query=True,
					)
				)
				if items:
					return DeckDocument(**items[0])
				return None
			except Exception:
				return None

		return self._memory_store.get(deck_id)

	def delete_deck(self, deck_id: str) -> bool:
		if self._container is not None:
			try:
				self._container.delete_item(item=deck_id, partition_key=deck_id)
				return True
			except Exception:
				return False

		return self._memory_store.pop(deck_id, None) is not None
