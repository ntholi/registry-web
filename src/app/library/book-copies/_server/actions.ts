'use server';

import type { bookCopies } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { bookCopiesService } from './service';

type BookCopy = typeof bookCopies.$inferInsert;

export async function getBookCopy(id: string) {
	return bookCopiesService.getWithBook(id);
}

export async function getBookCopies(bookId: string) {
	return bookCopiesService.findByBookId(bookId);
}

export async function getBookCopyBySerial(serialNumber: string) {
	return bookCopiesService.findBySerialNumber(serialNumber);
}

export const createBookCopy = createAction(async (data: BookCopy) =>
	bookCopiesService.create(data)
);

export const updateBookCopy = createAction(async (id: string, data: BookCopy) =>
	bookCopiesService.update(id, data)
);

export const withdrawBookCopy = createAction(async (id: string) =>
	bookCopiesService.withdraw(id)
);
