import type { Session } from '../auth';
import type { Action, PermissionGrant, Resource } from './permissions';

export const APPLICANT_SELF_SERVICE_ROLES = ['applicant', 'user'] as const;

export function hasPermission(
	session: { permissions?: PermissionGrant[] } | null | undefined,
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

export function hasAnyPermission(
	session: { permissions?: PermissionGrant[] } | null | undefined,
	resource: Resource,
	actions: readonly Action[]
) {
	return actions.some((action) => hasPermission(session, resource, action));
}

export function hasSessionRole(
	session: Session | null | undefined,
	roles: readonly string[]
) {
	const role = session?.user?.role;
	return typeof role === 'string' && roles.includes(role);
}

export function hasSessionPermission(
	session: Session | null | undefined,
	resource: Resource,
	action: Action,
	fallbackRoles: readonly string[] = []
) {
	return (
		hasPermission(session, resource, action) ||
		hasSessionRole(session, fallbackRoles)
	);
}

export function hasApplicantSelfServiceAccess(
	session: Session | null | undefined
) {
	return hasSessionRole(session, APPLICANT_SELF_SERVICE_ROLES);
}

export function hasApplicantResourceAccess(
	session: Session | null | undefined,
	resource: Resource,
	action: Action
) {
	return hasSessionPermission(
		session,
		resource,
		action,
		APPLICANT_SELF_SERVICE_ROLES
	);
}

export function isStudentSession(session: Session | null | undefined) {
	return session?.user?.role === 'student';
}

export function hasOwnedStudentSession(
	session: Session | null | undefined,
	stdNo: number
) {
	if (!isStudentSession(session)) {
		return false;
	}

	return session.user.stdNo === stdNo;
}
