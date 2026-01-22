import { users } from '@auth/users/_schema/users';
import { books } from '@library/books/_schema/books';
import { students } from '@registry/students/_schema/students';
import {
	bigint,
	index,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const reservationStatus = pgEnum('reservation_status', [
	'Active',
	'Fulfilled',
	'Cancelled',
	'Expired',
]);
export type ReservationStatus = (typeof reservationStatus.enumValues)[number];

export const reservations = pgTable(
	'reservations',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		bookId: text()
			.references(() => books.id, { onDelete: 'cascade' })
			.notNull(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		reservationDate: timestamp().notNull().defaultNow(),
		expiryDate: timestamp().notNull(),
		status: reservationStatus().notNull().default('Active'),
		reservedBy: text().references(() => users.id, { onDelete: 'set null' }),
		fulfilledBy: text().references(() => users.id, { onDelete: 'set null' }),
		fulfilledAt: timestamp(),
		cancelledBy: text().references(() => users.id, { onDelete: 'set null' }),
		cancelledAt: timestamp(),
		notes: text(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		bookIdIdx: index('idx_reservations_book_id').on(table.bookId),
		stdNoIdx: index('idx_reservations_std_no').on(table.stdNo),
		statusIdx: index('idx_reservations_status').on(table.status),
		expiryDateIdx: index('idx_reservations_expiry_date').on(table.expiryDate),
		stdNoStatusIdx: index('idx_reservations_std_no_status').on(
			table.stdNo,
			table.status
		),
	})
);
