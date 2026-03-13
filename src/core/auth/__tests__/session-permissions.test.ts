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
			{ resource: 'students', action: 'read' },
			{ resource: 'registration', action: 'approve' },
		],
		user: {
			id: 'student-1',
			role: 'student',
			stdNo: 1001,
		},
	};

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
