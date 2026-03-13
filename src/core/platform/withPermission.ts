import { forbidden, unauthorized } from 'next/navigation';
import { cache } from 'react';
import { auth, type Session } from '@/core/auth';
import {
	type AuthRequirement,
	DASHBOARD_ROLES,
	type PermissionGrant,
	type PermissionRequirement,
} from '@/core/auth/permissions';

type AccessCheckFunction = (session: Session) => Promise<boolean>;
type LegacyAuthRole = 'all' | 'auth' | 'dashboard' | string;
type LegacyAuthConfig = readonly LegacyAuthRole[];
type AuthConfig = AuthRequirement | AccessCheckFunction | LegacyAuthConfig;
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
	const functionName = fn.toString();

	try {
		if (requirement === 'all') {
			const result = await getSessionWithPermissions();
			return await fn(result?.session ?? null);
		}

		if (isLegacyRoleConfig(requirement)) {
			return await withLegacyRoleConfig(fn, requirement, functionName);
		}

		const result = await getSessionWithPermissions();

		if (!result) {
			logAuthError('No session found', functionName, { expectedAuth: true });
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
				logAuthError('Dashboard access denied', functionName, {
					currentRole: session.user.role,
					userId: session.user.id,
				});
				return forbidden();
			}

			return await fn(session);
		}

		if (typeof requirement === 'function') {
			let hasAccess = false;

			try {
				hasAccess = await requirement(session);
			} catch (error) {
				logAuthError('Access check function threw an error', functionName, {
					userId: session.user.id,
					userRole: session.user.role,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
				return forbidden();
			}

			if (!hasAccess) {
				logAuthError('Custom access check failed', functionName, {
					userId: session.user.id,
					userRole: session.user.role,
				});
				return forbidden();
			}

			return await fn(session);
		}

		if (!hasPermission(permissions, requirement)) {
			logAuthError('Permission requirement failed', functionName, {
				userId: session.user.id,
				userRole: session.user.role,
				requirement,
			});
			return forbidden();
		}

		return await fn(session);
	} catch (error) {
		logAuthError('Auth Error', functionName, {
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		throw error;
	}
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

async function withLegacyRoleConfig<T>(
	fn: (session: Session | null) => Promise<T>,
	roles: LegacyAuthConfig,
	functionName: string
): Promise<T> {
	if (roles.length === 1 && roles.includes('all')) {
		const result = await getSessionWithPermissions();
		return await fn(result?.session ?? null);
	}

	const result = await getSessionWithPermissions();

	if (!result) {
		logAuthError('No session found', functionName, { expectedAuth: true });
		return unauthorized();
	}

	const { session } = result;

	if (roles.includes('auth')) {
		return await fn(session);
	}

	if (session.user.role === 'admin') {
		return await fn(session);
	}

	const hasDashboardAccess =
		roles.includes('dashboard') &&
		DASHBOARD_ROLES.includes(
			session.user.role as (typeof DASHBOARD_ROLES)[number]
		);
	const otherRoles = roles.filter((role) => role !== 'dashboard');
	const hasRequiredRole = otherRoles.includes(session.user.role);

	if (!hasDashboardAccess && !hasRequiredRole) {
		logAuthError('Insufficient role permissions', functionName, {
			currentRole: session.user.role,
			requiredRoles: roles,
			userId: session.user.id,
		});
		return forbidden();
	}

	return await fn(session);
}

function hasPermission(
	permissions: PermissionGrant[],
	requirement: PermissionRequirement
): boolean {
	for (const [resource, actions] of Object.entries(requirement)) {
		for (const action of actions) {
			const granted = permissions.some(
				(permission) =>
					permission.resource === resource && permission.action === action
			);

			if (!granted) {
				return false;
			}
		}
	}

	return true;
}

function isLegacyRoleConfig(
	requirement: AuthConfig
): requirement is LegacyAuthConfig {
	return Array.isArray(requirement);
}

function logAuthError(
	message: string,
	functionName: string,
	details: Record<string, unknown>
): void {
	console.error(`[withPermission] ${message}`, {
		function: functionName,
		timestamp: new Date().toISOString(),
		...details,
	});
}

export default withPermission;
