import type { libraryResources } from '../_schema/libraryResources';

export type Resource = typeof libraryResources.$inferSelect;
export type ResourceInsert = typeof libraryResources.$inferInsert;

export type ResourceType =
	| 'PastPaper'
	| 'ResearchPaper'
	| 'Thesis'
	| 'Journal'
	| 'Other';

export type ResourceWithRelations = Resource & {
	document: {
		id: string;
		fileName: string;
		fileUrl: string | null;
		type: string | null;
		createdAt: Date | null;
	};
	uploadedByUser: {
		id: string;
		name: string | null;
	} | null;
};

export type ResourceFormData = {
	title: string;
	description: string;
	type: ResourceType;
	isDownloadable: boolean;
	file?: File;
};

export const RESOURCE_TYPE_OPTIONS = [
	{ value: 'PastPaper', label: 'Past Paper' },
	{ value: 'ResearchPaper', label: 'Research Paper' },
	{ value: 'Thesis', label: 'Thesis' },
	{ value: 'Journal', label: 'Journal' },
	{ value: 'Other', label: 'Other' },
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
