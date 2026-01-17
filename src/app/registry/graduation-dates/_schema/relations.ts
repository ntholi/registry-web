import { terms } from '@registry/terms/_schema/terms';
import { relations } from 'drizzle-orm';
import { graduationDates } from './graduationDates';

export const graduationRelations = relations(graduationDates, ({ one }) => ({
	term: one(terms, {
		fields: [graduationDates.termId],
		references: [terms.id],
	}),
}));
