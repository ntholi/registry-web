export type BookLookupResult = {
	id: string;
	title: string;
	subtitle?: string;
	description?: string;
	authors: string[];
	publisher?: string;
	publishedDate?: string;
	thumbnail?: string;
	isbn?: string;
};

type IndustryIdentifier = {
	type: string;
	identifier: string;
};

type GoogleBooksResponse = {
	totalItems?: number;
	items?: Array<{
		id: string;
		volumeInfo?: {
			title?: string;
			subtitle?: string;
			description?: string;
			authors?: string[];
			publisher?: string;
			publishedDate?: string;
			industryIdentifiers?: IndustryIdentifier[];
			imageLinks?: {
				thumbnail?: string;
				smallThumbnail?: string;
			};
		};
	}>;
};

function extractIsbn(identifiers?: IndustryIdentifier[]): string | undefined {
	if (!identifiers) return undefined;
	const isbn13 = identifiers.find((id) => id.type === 'ISBN_13');
	if (isbn13) return isbn13.identifier;
	const isbn10 = identifiers.find((id) => id.type === 'ISBN_10');
	return isbn10?.identifier;
}

function parseBookResults(data: GoogleBooksResponse): BookLookupResult[] {
	if (!data.items || data.items.length === 0) return [];

	return data.items.map((item) => ({
		id: item.id,
		title: item.volumeInfo?.title ?? 'Unknown Title',
		subtitle: item.volumeInfo?.subtitle,
		description: item.volumeInfo?.description,
		authors: item.volumeInfo?.authors ?? [],
		publisher: item.volumeInfo?.publisher,
		publishedDate: item.volumeInfo?.publishedDate,
		thumbnail:
			item.volumeInfo?.imageLinks?.thumbnail ??
			item.volumeInfo?.imageLinks?.smallThumbnail,
		isbn: extractIsbn(item.volumeInfo?.industryIdentifiers),
	}));
}

export async function lookupBookByIsbn(
	isbn: string
): Promise<BookLookupResult[]> {
	try {
		const response = await fetch(
			`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
		);
		if (!response.ok) return [];

		const data: GoogleBooksResponse = await response.json();
		return parseBookResults(data);
	} catch {
		return [];
	}
}

export async function lookupBookByTitle(
	title: string
): Promise<BookLookupResult[]> {
	try {
		const response = await fetch(
			`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=10`
		);
		if (!response.ok) return [];

		const data: GoogleBooksResponse = await response.json();
		return parseBookResults(data);
	} catch {
		return [];
	}
}

export async function lookupBook(
	isbn?: string,
	title?: string
): Promise<BookLookupResult[]> {
	if (isbn && isbn.length >= 10) {
		const results = await lookupBookByIsbn(isbn);
		if (results.length > 0) return results;
	}

	if (title && title.length >= 2) {
		return lookupBookByTitle(title);
	}

	return [];
}
