import { relations } from 'drizzle-orm';
import { bookCategories } from '@/core/database';
import { categories } from './categories';

export const categoriesRelations = relations(categories, ({ many }) => ({
	bookCategories: many(bookCategories),
}));
