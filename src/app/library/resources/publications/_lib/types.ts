import type { publications } from '../_schema/publications';

export type Publication = typeof publications.$inferSelect;
export type PublicationInsert = typeof publications.$inferInsert;

export type PublicationType = 'ResearchPaper' | 'Thesis' | 'Journal' | 'Other';

export type PublicationWithRelations = Publication & {
	document: {
		id: string;
		fileName: string;
		fileUrl: string | null;
	};
	publicationAuthors: Array<{
		author: {
			id: string;
			name: string;
		};
	}>;
};

export type PublicationFormData = {
	title: string;
	abstract: string;
	datePublished: string;
	type: PublicationType;
	authorIds: string[];
	file?: File;
};

export const PUBLICATION_TYPE_OPTIONS = [
	{ value: 'ResearchPaper', label: 'Research Paper' },
	{ value: 'Thesis', label: 'Thesis' },
	{ value: 'Journal', label: 'Journal' },
	{ value: 'Other', label: 'Other' },
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
