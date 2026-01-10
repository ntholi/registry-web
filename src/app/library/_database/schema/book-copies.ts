import {
	date,
	index,
	integer,
	pgTable,
	serial,
	text,
} from 'drizzle-orm/pg-core';
import { books } from './books';
import { bookCondition, bookCopyStatus } from './enums';

export const bookCopies = pgTable(
	'book_copies',
	{
		id: serial().primaryKey(),
		bookId: integer()
			.references(() => books.id, { onDelete: 'cascade' })
			.notNull(),
		serialNumber: text().notNull().unique(),
		condition: bookCondition().notNull().default('Good'),
		status: bookCopyStatus().notNull().default('Available'),
		location: text(),
		acquiredAt: date({ mode: 'date' }),
	},
	(table) => ({
		bookIdIdx: index('idx_book_copies_book_id').on(table.bookId),
		statusIdx: index('idx_book_copies_status').on(table.status),
		serialNumberIdx: index('idx_book_copies_serial_number').on(
			table.serialNumber
		),
	})
);
