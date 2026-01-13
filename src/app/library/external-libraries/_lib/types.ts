import type { externalLibraries } from '@/core/database';

export type ExternalLibrary = typeof externalLibraries.$inferSelect;
export type ExternalLibraryInsert = typeof externalLibraries.$inferInsert;
