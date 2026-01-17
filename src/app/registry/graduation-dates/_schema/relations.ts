import { relations } from 'drizzle-orm';
import { terms } from '@/core/database';
import { graduationDates } from './graduationDates';

export const graduationRelations = relations(graduationDates, ({ one }) => ({
	term: one(terms, {
		fields: [graduationDates.termId],
		references: [terms.id],
	}),
}));
