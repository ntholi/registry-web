'use server';

import type { books } from '@/core/database';
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

export async function createBook(
	book: Book,
	authorIds: string[],
	categoryIds: string[]
) {
	return booksService.createWithRelations(book, authorIds, categoryIds);
}

export async function updateBook(
	id: string,
	book: Book,
	authorIds: string[],
	categoryIds: string[]
) {
	return booksService.updateWithRelations(id, book, authorIds, categoryIds);
}

export async function deleteBook(id: string) {
	return booksService.delete(id);
}
