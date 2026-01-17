import { integer, pgEnum, pgTable, serial, text } from 'drizzle-orm/pg-core';

export const moduleStatusEnum = pgEnum('module_status', ['Active', 'Defunct']);

export const modules = pgTable('modules', {
	id: serial().primaryKey(),
	cmsId: integer().unique(),
	code: text().notNull(),
	name: text().notNull(),
	status: moduleStatusEnum().notNull().default('Active'),
	remark: text(),
	timestamp: text(),
});
