'use server';

import { booksService } from '@library/books/_server/service';
import type {
	PublicationType,
	PublicationWithRelations,
} from '@library/resources/publications/_lib/types';
import { publicationsService } from '@library/resources/publications/_server/service';

export async function getCatalogBooks(search = '') {
	const result = await booksService.findAll({
		page: 1,
		size: 50,
		search,
		searchColumns: ['title', 'isbn'],
		sort: [{ column: 'title', order: 'asc' }],
	});

	const booksWithRelations = await Promise.all(
		result.items.map((book) => booksService.getWithRelations(book.id))
	);

	return booksWithRelations.filter((b) => b !== null);
}

export async function getCatalogPublications(
	search = '',
	type?: PublicationType
): Promise<PublicationWithRelations[]> {
	const result = await publicationsService.getPublications(1, search, type);
	return result.items as PublicationWithRelations[];
}
