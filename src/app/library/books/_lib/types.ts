import type { bookCopies, books } from '@library/_database';

export type Book = typeof books.$inferSelect;
export type BookInsert = typeof books.$inferInsert;

export type BookWithRelations = Book & {
	bookAuthors: Array<{
		authorId: string;
		author: { id: string; name: string };
	}>;
	bookCategories: Array<{
		categoryId: string;
		category: { id: string; name: string };
	}>;
	bookCopies: Array<typeof bookCopies.$inferSelect>;
	availableCopies: number;
	totalCopies: number;
};
