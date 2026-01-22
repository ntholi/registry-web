import type { categories } from '@/core/database';

export type Category = typeof categories.$inferSelect;
export type CategoryInsert = typeof categories.$inferInsert;
