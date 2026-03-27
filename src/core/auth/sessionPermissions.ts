import type { Session } from '../auth';
import type {
	Action,
	DashboardRole,
	PermissionGrant,
	Resource,
} from './permissions';

export interface EffectiveViewer {
	role: DashboardRole;
	presetName: string | null;
	permissions: PermissionGrant[];
}

export function getEffectiveViewer(
	session: Session | null | undefined
): EffectiveViewer | null {
	if (!session?.user) return null;
	return {
		role: (session.viewingAs?.role ?? session.user.role) as DashboardRole,
		presetName:
			session.viewingAs?.presetName ?? session.user.presetName ?? null,
		permissions: session.viewingAs?.permissions ?? session.permissions ?? [],
	};
}

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

	return session?.user?.stdNo === stdNo;
}
