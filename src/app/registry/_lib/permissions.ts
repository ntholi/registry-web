import type { Session } from '@/core/auth';

type PermissionAction =
	| 'read'
	| 'create'
	| 'update'
	| 'delete'
	| 'approve'
	| 'reject';

export function hasRegistryPermission(
	session: Session | null | undefined,
	resource: string,
	action: PermissionAction
) {
	return (
		session?.permissions?.some(
			(permission) =>
				permission.resource === resource && permission.action === action
		) ?? false
	);
}

export function hasAnyRegistryPermission(
	session: Session | null | undefined,
	resource: string,
	actions: readonly PermissionAction[]
) {
	return actions.some((action) =>
		hasRegistryPermission(session, resource, action)
	);
}
