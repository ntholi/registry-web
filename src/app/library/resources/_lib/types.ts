import type { digitalResources } from '@/core/database';

export type Resource = typeof digitalResources.$inferSelect;
export type ResourceInsert = typeof digitalResources.$inferInsert;

export type ResourceType =
	| 'PastPaper'
	| 'ResearchPaper'
	| 'Thesis'
	| 'Journal'
	| 'Other';

export interface ResourceWithRelations extends Resource {
	uploadedByUser: {
		id: string;
		name: string | null;
	} | null;
}

export const RESOURCE_TYPE_OPTIONS = [
	{ value: 'PastPaper', label: 'Past Paper' },
	{ value: 'ResearchPaper', label: 'Research Paper' },
	{ value: 'Thesis', label: 'Thesis' },
	{ value: 'Journal', label: 'Journal' },
	{ value: 'Other', label: 'Other' },
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
