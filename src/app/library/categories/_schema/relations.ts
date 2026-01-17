import { bookCategories } from '@library/books/_schema/bookCategories';
import { relations } from 'drizzle-orm';
import { categories } from './categories';

export const categoriesRelations = relations(categories, ({ many }) => ({
	bookCategories: many(bookCategories),
}));
