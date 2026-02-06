import type { subjectAliases, subjects } from '@/core/database';

export type Subject = typeof subjects.$inferSelect;
export type SubjectInsert = typeof subjects.$inferInsert;

export type SubjectAlias = typeof subjectAliases.$inferSelect;
export type SubjectAliasInsert = typeof subjectAliases.$inferInsert;

export type SubjectWithAliases = Subject & {
	aliases: SubjectAlias[];
};

export type SubjectFilter = {
	lqfLevel?: number | null;
};
