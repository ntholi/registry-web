import { describe, expect, it } from 'vitest';
import {
	hasAnyPermission,
	hasOwnedStudentSession,
	hasPermission,
	hasSessionPermission,
	hasSessionRole,
	isStudentSession,
} from '@/core/auth/sessionPermissions';

describe('session permission helpers', () => {
	const session = {
		permissions: [
			{ resource: 'students' as const, action: 'read' as const },
			{ resource: 'registration' as const, action: 'approve' as const },
		],
		session: {
			id: 'session-1',
			userId: 'student-1',
			expiresAt: new Date(),
			token: 'test',
			createdAt: new Date(),
			updatedAt: new Date(),
			ipAddress: null,
			userAgent: null,
		},
		user: {
			id: 'student-1',
			role: 'student' as const,
			stdNo: 1001,
		},
	} as unknown as import('@/core/auth').Session;

	it('checks a single permission grant', () => {
		expect(hasPermission(session, 'students', 'read')).toBe(true);
		expect(hasPermission(session, 'students', 'delete')).toBe(false);
	});

	it('checks multiple actions for a resource', () => {
		expect(hasAnyPermission(session, 'registration', ['read', 'approve'])).toBe(
			true
		);
		expect(hasAnyPermission(session, 'registration', ['read', 'delete'])).toBe(
			false
		);
	});

	it('checks role fallback rules', () => {
		expect(hasSessionRole(session, ['student', 'registry'])).toBe(true);
		expect(
			hasSessionPermission(session, 'students', 'delete', ['student'])
		).toBe(true);
		expect(
			hasSessionPermission(session, 'students', 'delete', ['registry'])
		).toBe(false);
	});

	it('checks owned student access using stdNo', () => {
		expect(isStudentSession(session)).toBe(true);
		expect(hasOwnedStudentSession(session, 1001)).toBe(true);
		expect(hasOwnedStudentSession(session, 2002)).toBe(false);
	});
});
