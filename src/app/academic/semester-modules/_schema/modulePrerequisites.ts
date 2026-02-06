import {
	integer,
	pgTable,
	serial,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { semesterModules } from './semesterModules';

export const modulePrerequisites = pgTable(
	'module_prerequisites',
	{
		id: serial().primaryKey(),
		cmsId: integer().unique(),
		semesterModuleId: integer()
			.references(() => semesterModules.id, { onDelete: 'cascade' })
			.notNull(),
		prerequisiteId: integer()
			.references(() => semesterModules.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		uniquePrerequisite: unique().on(
			table.semesterModuleId,
			table.prerequisiteId
		),
	})
);
