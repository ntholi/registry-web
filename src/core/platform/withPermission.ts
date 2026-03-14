import { forbidden, unauthorized } from 'next/navigation';
import { cache } from 'react';
import { auth, type Session } from '@/core/auth';
import {
	type AuthRequirement,
	DASHBOARD_ROLES,
	hasPermission,
	type PermissionGrant,
} from '@/core/auth/permissions';

type AccessCheckFunction = (session: Session) => Promise<boolean>;
type AuthConfig = AuthRequirement | AccessCheckFunction;
type SessionPermissionResult = {
	session: Session;
	permissions: PermissionGrant[];
};

const getSessionWithPermissions = cache(
	async (): Promise<SessionPermissionResult | null> => {
		const session = await auth();

		if (!session) {
			return null;
		}

		const permissions = Array.isArray(session.permissions)
			? session.permissions
			: [];

		return {
			session,
			permissions,
		};
	}
);

export async function withPermission<T>(
	fn: (session: Session | null) => Promise<T>,
	requirement: AuthConfig
): Promise<T> {
	if (requirement === 'all') {
		const result = await getSessionWithPermissions();
		return await fn(result?.session ?? null);
	}

	const result = await getSessionWithPermissions();

	if (!result) {
		return unauthorized();
	}

	const { session, permissions } = result;

	if (requirement === 'auth') {
		return await fn(session);
	}

	if (session.user.role === 'admin') {
		return await fn(session);
	}

	if (requirement === 'dashboard') {
		if (
			!DASHBOARD_ROLES.includes(
				session.user.role as (typeof DASHBOARD_ROLES)[number]
			)
		) {
			return forbidden();
		}

		return await fn(session);
	}

	if (typeof requirement === 'function') {
		try {
			if (!(await requirement(session))) {
				return forbidden();
			}
		} catch {
			return forbidden();
		}

		return await fn(session);
	}

	if (!hasPermission(permissions, requirement)) {
		return forbidden();
	}

	return await fn(session);
}

export async function getSession(): Promise<Session | null> {
	const result = await getSessionWithPermissions();
	return result?.session ?? null;
}

export async function getSessionPermissions(): Promise<SessionPermissionResult | null> {
	return await getSessionWithPermissions();
}

export function requireSessionUserId(
	session: { user?: { id?: string | null } } | null | undefined
): string {
	const userId = session?.user?.id;

	if (!userId) {
		throw new Error('User not authenticated');
	}

	return userId;
}

export default withPermission;
