type GoogleBooksResponse = {
	items?: Array<{
		volumeInfo: {
			imageLinks?: {
				thumbnail?: string;
				smallThumbnail?: string;
			};
		};
	}>;
};

export async function fetchBookCoverByIsbn(
	isbn: string
): Promise<string | null> {
	try {
		const response = await fetch(
			`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
		);
		if (!response.ok) return null;

		const data: GoogleBooksResponse = await response.json();
		const imageLinks = data.items?.[0]?.volumeInfo?.imageLinks;

		return imageLinks?.thumbnail ?? imageLinks?.smallThumbnail ?? null;
	} catch {
		return null;
	}
}
