import { users } from '@auth/users/_schema/users';
import { books } from '@library/books/_schema/books';
import { students } from '@registry/students/_schema/students';
import { relations } from 'drizzle-orm';
import { reservations } from './reservations';

export const reservationsRelations = relations(reservations, ({ one }) => ({
	book: one(books, {
		fields: [reservations.bookId],
		references: [books.id],
	}),
	student: one(students, {
		fields: [reservations.stdNo],
		references: [students.stdNo],
	}),
	reservedByUser: one(users, {
		fields: [reservations.reservedBy],
		references: [users.id],
		relationName: 'reservedBy',
	}),
	fulfilledByUser: one(users, {
		fields: [reservations.fulfilledBy],
		references: [users.id],
		relationName: 'fulfilledBy',
	}),
	cancelledByUser: one(users, {
		fields: [reservations.cancelledBy],
		references: [users.id],
		relationName: 'cancelledBy',
	}),
}));
