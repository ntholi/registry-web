import { users } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
import { permissionPresets } from './permissionPresets';
import { presetPermissions } from './presetPermissions';

export const permissionPresetsRelations = relations(
	permissionPresets,
	({ many }) => ({
		permissions: many(presetPermissions),
		users: many(users),
	})
);

export const presetPermissionsRelations = relations(
	presetPermissions,
	({ one }) => ({
		preset: one(permissionPresets, {
			fields: [presetPermissions.presetId],
			references: [permissionPresets.id],
		}),
	})
);
