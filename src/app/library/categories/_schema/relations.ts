import { relations } from 'drizzle-orm';
import { bookCategories } from '../../books/_schema/bookCategories';
import { categories } from './categories';

export const categoriesRelations = relations(categories, ({ many }) => ({
	bookCategories: many(bookCategories),
}));
