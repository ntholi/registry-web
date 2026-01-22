import { authors } from '@library/authors/_schema/authors';
import { pgTable, primaryKey, text } from 'drizzle-orm/pg-core';
import { publications } from './publications';

export const publicationAuthors = pgTable(
	'publication_authors',
	{
		publicationId: text()
			.references(() => publications.id, { onDelete: 'cascade' })
			.notNull(),
		authorId: text()
			.references(() => authors.id, { onDelete: 'cascade' })
			.notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.publicationId, table.authorId] }),
	})
);
