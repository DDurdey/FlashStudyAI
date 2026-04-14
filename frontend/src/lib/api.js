const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

async function parseResponse(response) {
	if (!response.ok) {
		const message = await response.text()
		throw new Error(message || `Request failed with status ${response.status}`)
	}

	return response.json()
}

export async function uploadDocument({ file, deckName = 'Untitled Deck', cardCount = 10 }) {
	const formData = new FormData()
	formData.append('file', file)
	formData.append('deck_name', deckName)
	formData.append('card_count', String(cardCount))

	const response = await fetch(`${API_BASE_URL}/api/upload`, {
		method: 'POST',
		body: formData,
	})

	return parseResponse(response)
}

export async function getDeck(deckId) {
	const response = await fetch(`${API_BASE_URL}/api/flashcards/${deckId}`)
	return parseResponse(response)
}

export async function getDeckTopics(deckId) {
	const response = await fetch(`${API_BASE_URL}/api/flashcards/${deckId}/topics`)
	return parseResponse(response)
}