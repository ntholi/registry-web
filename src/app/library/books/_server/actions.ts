'use server';

import type { books } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { booksService } from './service';

type Book = typeof books.$inferInsert;

export async function getBook(id: string) {
	return booksService.getWithRelations(id);
}

export async function getBooks(page = 1, search = '') {
	return booksService.findAll({
		page,
		search,
		searchColumns: ['title', 'isbn'],
		sort: [{ column: 'title', order: 'asc' }],
	});
}

export const createBook = createAction(
	async (book: Book, authorIds: string[], categoryIds: string[]) =>
		booksService.createWithRelations(book, authorIds, categoryIds)
);

export const updateBook = createAction(
	async (id: string, book: Book, authorIds: string[], categoryIds: string[]) =>
		booksService.updateWithRelations(id, book, authorIds, categoryIds)
);

export const deleteBook = createAction(async (id: string) =>
	booksService.delete(id)
);
