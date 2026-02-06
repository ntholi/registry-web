import { modules } from '@academic/modules/_schema/modules';
import { documents } from '@registry/documents/_schema/documents';
import { terms } from '@registry/terms/_schema/terms';
import { relations } from 'drizzle-orm';
import { questionPapers } from './questionPapers';

export const questionPapersRelations = relations(questionPapers, ({ one }) => ({
	document: one(documents, {
		fields: [questionPapers.documentId],
		references: [documents.id],
	}),
	module: one(modules, {
		fields: [questionPapers.moduleId],
		references: [modules.id],
	}),
	term: one(terms, {
		fields: [questionPapers.termId],
		references: [terms.id],
	}),
}));
