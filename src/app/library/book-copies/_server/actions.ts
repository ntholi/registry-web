'use server';

import type { bookCopies } from '@/core/database';
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

export async function createBookCopy(data: BookCopy) {
	return bookCopiesService.create(data);
}

export async function updateBookCopy(id: string, data: BookCopy) {
	return bookCopiesService.update(id, data);
}

export async function withdrawBookCopy(id: string) {
	return bookCopiesService.withdraw(id);
}
