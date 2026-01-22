import { modules } from '@academic/modules/_schema/modules';
import { documents } from '@registry/documents/_schema/documents';
import { terms } from '@registry/terms/_schema/terms';
import { sql } from 'drizzle-orm';
import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const questionPapers = pgTable(
	'question_papers',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		documentId: text()
			.references(() => documents.id, { onDelete: 'cascade' })
			.notNull(),
		title: text().notNull(),
		moduleId: integer()
			.references(() => modules.id, { onDelete: 'cascade' })
			.notNull(),
		termId: integer()
			.references(() => terms.id, { onDelete: 'cascade' })
			.notNull(),
		assessmentType: text().notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		titleTrigramIdx: index('idx_question_papers_title_trgm').using(
			'gin',
			sql`${table.title} gin_trgm_ops`
		),
		moduleIdx: index('fk_question_papers_module').on(table.moduleId),
		termIdx: index('fk_question_papers_term').on(table.termId),
		documentIdx: index('fk_question_papers_document').on(table.documentId),
	})
);
