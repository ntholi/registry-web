'use server';

import { forbidden, unauthorized } from 'next/navigation';
import type { Session } from 'next-auth';
import { auth } from '@/core/auth';
import { dashboardUsers, type UserRole } from '@/core/db/schema';

type Role = UserRole | 'all' | 'auth' | 'dashboard';
type AccessCheckFunction = (session: Session) => Promise<boolean>;

export default async function withAuth<T>(
	fn: (session?: Session | null) => Promise<T>,
	roles: Role[]
): Promise<T>;

export default async function withAuth<T>(
	fn: (session?: Session | null) => Promise<T>,
	accessCheck: AccessCheckFunction
): Promise<T>;

export default async function withAuth<T>(
	fn: (session?: Session | null) => Promise<T>,
	rolesOrAccessCheck: Role[] | AccessCheckFunction
): Promise<T> {
	const session = await auth();
	const functionName = fn.toString();

	const isRoleBased = Array.isArray(rolesOrAccessCheck);
	const roles = isRoleBased ? rolesOrAccessCheck : [];
	const accessCheck = isRoleBased ? null : rolesOrAccessCheck;

	try {
		if (isRoleBased && roles.length === 1 && roles.includes('all')) {
			return await fn(session);
		}

		if (!session?.user) {
			logAuthError('No session found', functionName, { expectedAuth: true });
			return unauthorized();
		}

		if (isRoleBased && roles.includes('auth')) {
			return await fn(session);
		}

		const isAdmin = session.user.role === 'admin';

		if (isRoleBased && isAdmin) {
			return await fn(session);
		}

		if (isRoleBased && roles.includes('dashboard')) {
			const isDashboardUser = dashboardUsers.enumValues.includes(
				session.user.role as (typeof dashboardUsers.enumValues)[number]
			);

			if (!isDashboardUser) {
				logAuthError(
					'Insufficient permissions for dashboard access',
					functionName,
					{
						currentRole: session.user.role,
						requiredRoles: roles,
						userId: session.user.id,
					}
				);
				return forbidden();
			}

			return await fn(session);
		}

		if (isRoleBased) {
			const hasRequiredRole = roles.includes(session.user.role as Role);

			if (!hasRequiredRole) {
				logAuthError('Insufficient role permissions', functionName, {
					currentRole: session.user.role,
					requiredRoles: roles,
					userId: session.user.id,
				});
				return forbidden();
			}

			return await fn(session);
		}

		if (accessCheck) {
			let hasAccess = false;

			try {
				hasAccess = await accessCheck(session);
			} catch (error) {
				logAuthError('Access check function threw an error', functionName, {
					userId: session.user.id,
					userRole: session.user.role,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
				return forbidden();
			}

			if (!hasAccess && !isAdmin) {
				logAuthError('Custom access check failed', functionName, {
					userId: session.user.id,
					userRole: session.user.role,
				});
				return forbidden();
			}

			return await fn(session);
		}

		logAuthError('Invalid authorization configuration', functionName, {
			rolesOrAccessCheck: typeof rolesOrAccessCheck,
		});
		return forbidden();
	} catch (error) {
		logAuthError('Auth Error', functionName, {
			error: error instanceof Error ? error.message : 'Unknown error',
			userId: session?.user?.id,
		});
		throw error;
	}
}

function logAuthError(
	message: string,
	functionName: string,
	details: Record<string, unknown>
): void {
	console.error(`[withAuth] ${message}`, {
		function: functionName,
		timestamp: new Date().toISOString(),
		...details,
	});
}
