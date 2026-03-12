import { index, pgTable, text, unique } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { permissionPresets } from './permissionPresets';

export const presetPermissions = pgTable(
	'preset_permissions',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		presetId: text('preset_id')
			.references(() => permissionPresets.id, { onDelete: 'cascade' })
			.notNull(),
		resource: text().notNull(),
		action: text().notNull(),
	},
	(table) => ({
		uniquePresetResourceAction: unique().on(
			table.presetId,
			table.resource,
			table.action
		),
		presetIdIdx: index('idx_preset_permissions_preset_id').on(table.presetId),
	})
);
