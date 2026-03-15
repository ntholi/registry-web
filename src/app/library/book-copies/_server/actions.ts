'use server';

import type { bookCopies } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { bookCopiesService } from './service';

type BookCopy = typeof bookCopies.$inferInsert;

export const getBookCopy = createAction(async (id: string) => {
	return bookCopiesService.getWithBook(id);
});

export const getBookCopies = createAction(async (bookId: string) => {
	return bookCopiesService.findByBookId(bookId);
});

export const getBookCopyBySerial = createAction(
	async (serialNumber: string) => {
		return bookCopiesService.findBySerialNumber(serialNumber);
	}
);

export const createBookCopy = createAction(async (data: BookCopy) => {
	return bookCopiesService.create(data);
});

export const updateBookCopy = createAction(
	async (id: string, data: BookCopy) => {
		return bookCopiesService.update(id, data);
	}
);

export const withdrawBookCopy = createAction(async (id: string) => {
	return bookCopiesService.withdraw(id);
});
