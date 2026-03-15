'use server';

import type { books } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { booksService } from './service';

type Book = typeof books.$inferInsert;

export const getBook = createAction(async (id: string) => {
	return booksService.getWithRelations(id);
});

export const getBooks = createAction(
	async (page: number = 1, search: string = '') => {
		return booksService.findAll({
			page,
			search,
			searchColumns: ['title', 'isbn'],
			sort: [{ column: 'title', order: 'asc' }],
		});
	}
);

export const createBook = createAction(
	async (book: Book, authorIds: string[], categoryIds: string[]) => {
		return booksService.createWithRelations(book, authorIds, categoryIds);
	}
);

export const updateBook = createAction(
	async (
		id: string,
		book: Book,
		authorIds: string[],
		categoryIds: string[]
	) => {
		return booksService.updateWithRelations(id, book, authorIds, categoryIds);
	}
);

export const deleteBook = createAction(async (id: string) => {
	return booksService.delete(id);
});
