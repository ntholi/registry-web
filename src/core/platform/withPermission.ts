import { headers } from 'next/headers';
import { forbidden, unauthorized } from 'next/navigation';
import { cache } from 'react';
import { auth, betterAuthServer, type Session } from '@/core/auth';
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
type SessionWithPermissions = Session & { permissions?: PermissionGrant[] };
type SessionPermissionResult = {
	session: Session;
	permissions: PermissionGrant[];
};

const getSessionWithPermissions = cache(
	async (): Promise<SessionPermissionResult | null> => {
		const requestHeaders = await headers();
		const [session, legacySession] = await Promise.all([
			betterAuthServer.api.getSession({ headers: requestHeaders }),
			auth(),
		]);

		if (!session && !legacySession) {
			return null;
		}

		if (!session && legacySession) {
			return {
				session: legacySession,
				permissions: [],
			};
		}

		const currentSession = session as SessionWithPermissions;
		const permissions = Array.isArray(currentSession.permissions)
			? currentSession.permissions
			: [];

		return {
			session: mergeSession(currentSession, legacySession, permissions),
			permissions,
		};
	}
);

export async function withPermission<T>(
	fn: (session: Session | null) => Promise<T>,
	requirement: AuthRequirement | AccessCheckFunction
): Promise<T>;

export async function withPermission<T>(
	fn: (session: Session | null) => Promise<T>,
	roles: LegacyAuthConfig
): Promise<T>;

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

function mergeSession(
	rawSession: SessionWithPermissions,
	legacySession: Session | null,
	permissions: PermissionGrant[]
): Session {
	const betterAuthUser = rawSession.user as Record<string, unknown>;
	const betterAuthSession = rawSession.session as
		| { expiresAt?: Date | string | null }
		| undefined;
	const expiresAt = betterAuthSession?.expiresAt;

	return {
		...(legacySession ?? {}),
		user: {
			...(legacySession?.user ?? {}),
			id: rawSession.user.id,
			name: rawSession.user.name,
			email: rawSession.user.email,
			image: rawSession.user.image ?? null,
			role: readStringField(betterAuthUser, 'role') ?? legacySession?.user.role,
			position:
				readStringField(betterAuthUser, 'position') ??
				legacySession?.user.position ??
				null,
			stdNo:
				readNumberField(betterAuthUser, 'stdNo') ?? legacySession?.user.stdNo,
			presetId:
				readStringField(betterAuthUser, 'presetId') ??
				legacySession?.user.presetId ??
				null,
		},
		expires:
			legacySession?.expires ??
			(expiresAt instanceof Date
				? expiresAt.toISOString()
				: typeof expiresAt === 'string'
					? expiresAt
					: new Date().toISOString()),
		permissions,
		session: rawSession.session,
	};
}

function readNumberField(
	obj: Record<string, unknown>,
	key: string
): number | null | undefined {
	const value = obj[key];

	if (typeof value === 'number') {
		return value;
	}

	return null;
}

function readStringField(
	obj: Record<string, unknown>,
	key: string
): string | null | undefined {
	const value = obj[key];

	if (typeof value === 'string') {
		return value;
	}

	return null;
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
