import { z } from 'zod/v4';
import {
	ACTIONS,
	DASHBOARD_ROLES,
	type PermissionGrant,
	RESOURCES,
} from '@/core/auth/permissions';
import type { permissionPresets } from '../_schema/permissionPresets';

export const resourceSchema = z.enum(RESOURCES);
export const actionSchema = z.enum(ACTIONS);
export const dashboardRoleSchema = z.enum(DASHBOARD_ROLES);
export const permissionGrantSchema = z.object({
	resource: resourceSchema,
	action: actionSchema,
});

export const presetFormSchema = z.object({
	name: z.string().min(1),
	role: dashboardRoleSchema,
	description: z.string().optional(),
	permissions: z.array(permissionGrantSchema),
});

export type PresetFormValues = z.infer<typeof presetFormSchema>;

type PermissionPresetRow = typeof permissionPresets.$inferSelect;

type PermissionPresetBase = Omit<PermissionPresetRow, 'role'> & {
	role: z.infer<typeof dashboardRoleSchema>;
};

export interface PermissionPresetListItem extends PermissionPresetBase {
	permissionCount: number;
}

export interface PermissionPresetDetail extends PermissionPresetBase {
	permissions: PermissionGrant[];
	permissionCount: number;
}
