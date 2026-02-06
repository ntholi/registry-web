import { pgTable, text, unique } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { categories } from '../../categories/_schema/categories';
import { books } from './books';

export const bookCategories = pgTable(
	'book_categories',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		bookId: text()
			.references(() => books.id, { onDelete: 'cascade' })
			.notNull(),
		categoryId: text()
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
