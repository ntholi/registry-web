import { PERMISSION_PRESET_SEEDS } from '@auth/permission-presets/_lib/catalog';
import { describe, expect, it } from 'vitest';
import type { Session } from '@/core/auth';
import { getApprovalRolesByUser } from '../approvalRoles';

function createSession(
	user: Partial<Session['user']>,
	permissions: Session['permissions'] = []
): Session {
	return {
		permissions,
		session: {
			id: 'session-1',
			userId: user.id ?? 'user-1',
			expiresAt: new Date(),
			token: 'token',
			createdAt: new Date(),
			updatedAt: new Date(),
			ipAddress: null,
			userAgent: null,
		},
		user: {
			id: user.id ?? 'user-1',
			email: 'test@example.com',
			emailVerified: true,
			name: 'Test User',
			image: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			role: user.role ?? 'user',
			presetId: user.presetId ?? null,
			presetName: user.presetName ?? null,
			stdNo: user.stdNo ?? null,
		},
	};
}

describe('student status approval roles', () => {
	it('allows finance users with approve permission to act on finance steps', () => {
		const session = createSession({ role: 'finance' }, [
			{ resource: 'student-statuses', action: 'approve' },
		]);

		expect(getApprovalRolesByUser(session)).toEqual(['finance']);
	});

	it('allows student services users with approve permission to act on student services steps', () => {
		const session = createSession({ role: 'student_services' }, [
			{ resource: 'student-statuses', action: 'approve' },
		]);

		expect(getApprovalRolesByUser(session)).toEqual(['student_services']);
	});

	it('maps academic leadership presets to the expected approval roles', () => {
		const yearLeader = createSession(
			{ role: 'academic', presetName: 'Year Leader' },
			[{ resource: 'student-statuses', action: 'approve' }]
		);
		const academicManager = createSession(
			{ role: 'academic', presetName: 'Academic Manager' },
			[{ resource: 'student-statuses', action: 'approve' }]
		);

		expect(getApprovalRolesByUser(yearLeader)).toEqual(['year_leader']);
		expect(getApprovalRolesByUser(academicManager)).toEqual(['program_leader']);
	});

	it('keeps create access on student statuses for registry and student services presets', () => {
		const presetNames = [
			'Registry Staff',
			'Registry Manager',
			'Student Services Staff',
		];

		for (const presetName of presetNames) {
			const preset = PERMISSION_PRESET_SEEDS.find(
				(item) => item.name === presetName
			);

			expect(preset?.permissions).toContainEqual({
				resource: 'student-statuses',
				action: 'create',
			});
		}
	});
});
