'use server';

import type { books } from '@/core/database';
import { fetchBookCoverByIsbn } from '../../_lib/google-books';
import { booksService } from './service';

type Book = typeof books.$inferInsert;

export async function getBook(id: number) {
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
	authorIds: number[],
	categoryIds: number[]
) {
	return booksService.createWithRelations(book, authorIds, categoryIds);
}

export async function updateBook(
	id: number,
	book: Book,
	authorIds: number[],
	categoryIds: number[]
) {
	return booksService.updateWithRelations(id, book, authorIds, categoryIds);
}

export async function deleteBook(id: number) {
	return booksService.delete(id);
}

export async function fetchBookCover(isbn: string) {
	return fetchBookCoverByIsbn(isbn);
}
