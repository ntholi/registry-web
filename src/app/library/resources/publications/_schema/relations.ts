import { authors } from '@library/authors/_schema/authors';
import { documents } from '@registry/documents/_schema/documents';
import { relations } from 'drizzle-orm';
import { publicationAuthors } from './publicationAuthors';
import { publications } from './publications';

export const publicationsRelations = relations(
	publications,
	({ one, many }) => ({
		document: one(documents, {
			fields: [publications.documentId],
			references: [documents.id],
		}),
		publicationAuthors: many(publicationAuthors),
	})
);

export const publicationAuthorsRelations = relations(
	publicationAuthors,
	({ one }) => ({
		publication: one(publications, {
			fields: [publicationAuthors.publicationId],
			references: [publications.id],
		}),
		author: one(authors, {
			fields: [publicationAuthors.authorId],
			references: [authors.id],
		}),
	})
);
