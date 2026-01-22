import { integer, pgTable, serial, unique } from 'drizzle-orm/pg-core';
import { categories } from '../../categories/_schema/categories';
import { books } from './books';

export const bookCategories = pgTable(
	'book_categories',
	{
		id: serial().primaryKey(),
		bookId: integer()
			.references(() => books.id, { onDelete: 'cascade' })
			.notNull(),
		categoryId: integer()
			.references(() => categories.id, { onDelete: 'cascade' })
			.notNull(),
	},
	(table) => ({
		bookCategoryUnique: unique('book_category_unique').on(
			table.bookId,
			table.categoryId
		),
	})
);
