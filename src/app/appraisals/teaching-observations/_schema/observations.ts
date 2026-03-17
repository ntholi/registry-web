import { assignedModules } from '@academic/assigned-modules/_schema/assignedModules';
import { users } from '@auth/users/_schema/users';
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { feedbackCycles } from '../../cycles/_schema/feedbackCycles';

export const observations = pgTable(
	'observations',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		cycleId: text()
			.references(() => feedbackCycles.id)
			.notNull(),
		assignedModuleId: integer()
			.references(() => assignedModules.id)
			.notNull(),
		observerId: text()
			.references(() => users.id)
			.notNull(),
		status: text().notNull().default('draft'),
		strengths: text(),
		improvements: text(),
		recommendations: text(),
		trainingArea: text(),
		submittedAt: timestamp(),
		acknowledgedAt: timestamp(),
		acknowledgmentComment: text(),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp().defaultNow(),
	},
	(table) => ({
		uniqueCycleModule: unique().on(table.cycleId, table.assignedModuleId),
		cycleIdIdx: index('idx_observations_cycle_id').on(table.cycleId),
		observerIdIdx: index('idx_observations_observer_id').on(table.observerId),
		assignedModuleIdIdx: index('idx_observations_assigned_module_id').on(
			table.assignedModuleId
		),
		statusIdx: index('idx_observations_status').on(table.status),
	})
);
