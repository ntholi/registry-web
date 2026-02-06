import { books } from '@library/books/_schema/books';
import { date, index, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const bookCondition = pgEnum('book_condition', [
	'New',
	'Good',
	'Damaged',
]);
export type BookCondition = (typeof bookCondition.enumValues)[number];

export const bookCopyStatus = pgEnum('book_copy_status', [
	'Available',
	'OnLoan',
	'Withdrawn',
]);
export type BookCopyStatus = (typeof bookCopyStatus.enumValues)[number];

export const bookCopies = pgTable(
	'book_copies',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		bookId: text()
			.references(() => books.id, { onDelete: 'cascade' })
			.notNull(),
		serialNumber: text().notNull().unique(),
		condition: bookCondition().notNull().default('Good'),
		status: bookCopyStatus().notNull().default('Available'),
		location: text(),
		acquiredAt: date({ mode: 'string' }),
	},
	(table) => ({
		bookIdIdx: index('idx_book_copies_book_id').on(table.bookId),
		statusIdx: index('idx_book_copies_status').on(table.status),
		serialNumberIdx: index('idx_book_copies_serial_number').on(
			table.serialNumber
		),
	})
);
