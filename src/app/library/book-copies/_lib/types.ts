import type { bookCopies, books } from '@library/_database';

export type BookCopy = typeof bookCopies.$inferSelect;
export type BookCopyInsert = typeof bookCopies.$inferInsert;

export type BookCopyWithBook = BookCopy & {
	book: typeof books.$inferSelect;
};
