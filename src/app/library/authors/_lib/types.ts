import type { authors } from '@library/_database';

export type Author = typeof authors.$inferSelect;
export type AuthorInsert = typeof authors.$inferInsert;
