import { eq } from 'drizzle-orm';
import {
	ACTIONS,
	type Action,
	type PermissionGrant,
	RESOURCES,
	type Resource,
} from '@/core/auth/permissions';
import { db, presetPermissions } from '@/core/database';

function isResource(value: string): value is Resource {
	return RESOURCES.includes(value as Resource);
}

function isAction(value: string): value is Action {
	return ACTIONS.includes(value as Action);
}

export async function listPresetPermissions(
	presetId: string
): Promise<PermissionGrant[]> {
	const rows = await db
		.select({
			resource: presetPermissions.resource,
			action: presetPermissions.action,
		})
		.from(presetPermissions)
		.where(eq(presetPermissions.presetId, presetId));

	return rows.filter((row): row is PermissionGrant => {
		return isResource(row.resource) && isAction(row.action);
	});
}
