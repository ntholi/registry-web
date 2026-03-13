import type { Session } from '@/core/auth';
import type { Action, Resource } from './permissions';

export function hasSessionPermission(
	session: Session | null | undefined,
	resource: Resource,
	action: Action
) {
	return (
		session?.permissions?.some(
			(permission) =>
				permission.resource === resource && permission.action === action
		) ?? false
	);
}

export function hasAnySessionPermission(
	session: Session | null | undefined,
	resource: Resource,
	actions: readonly Action[]
) {
	return actions.some((action) =>
		hasSessionPermission(session, resource, action)
	);
}
