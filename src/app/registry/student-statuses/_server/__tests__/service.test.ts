import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@/core/auth';
import { hasAnyPermission } from '@/core/auth/sessionPermissions';

const deleteFileMock = vi.fn();
const uploadFileMock = vi.fn();
const findApprovalByIdMock = vi.fn();
const respondToApprovalMock = vi.fn();
const getApprovalsByAppIdMock = vi.fn();
const findByIdMock = vi.fn();
const predicateCheckMock = vi.fn();
const updateForStatusWorkflowMock = vi.fn();
const updateStudentSemesterForStatusWorkflowMock = vi.fn();

let currentSession = {
	permissions: [{ resource: 'student-statuses', action: 'approve' }],
	session: {
		id: 'session-1',
		userId: 'finance-1',
		expiresAt: new Date(),
		token: 'token',
		createdAt: new Date(),
		updatedAt: new Date(),
		ipAddress: null,
		userAgent: null,
	},
	user: {
		id: 'finance-1',
		email: 'finance@example.com',
		emailVerified: true,
		name: 'Finance User',
		image: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		role: 'finance',
		presetId: null,
		presetName: null,
		stdNo: null,
	},
} as Session;

vi.mock('@/core/integrations/storage', () => ({
	deleteFile: deleteFileMock,
	uploadFile: uploadFileMock,
}));

vi.mock('@registry/students/_server/service', () => ({
	studentsService: {
		updateForStatusWorkflow: updateForStatusWorkflowMock,
		updateStudentSemesterForStatusWorkflow:
			updateStudentSemesterForStatusWorkflowMock,
	},
}));

vi.mock('../repository', () => ({
	studentStatusRepository: {
		findApprovalById: findApprovalByIdMock,
		respondToApproval: respondToApprovalMock,
		getApprovalsByAppId: getApprovalsByAppIdMock,
		findById: findByIdMock,
	},
}));

vi.mock('@/core/platform/withPermission', () => ({
	requireSessionUserId(session: Session | null | undefined) {
		if (!session?.user?.id) {
			throw new Error('User not authenticated');
		}

		return session.user.id;
	},
	async withPermission<T>(
		fn: (session: Session | null) => Promise<T>,
		requirement:
			| { 'student-statuses': ('create' | 'update' | 'approve')[] }
			| ((session: Session) => Promise<boolean>)
	) {
		if (typeof requirement !== 'function') {
			if (
				!hasAnyPermission(
					currentSession,
					'student-statuses',
					requirement['student-statuses']
				)
			) {
				throw new Error('Forbidden');
			}

			return fn(currentSession);
		}

		if (!(await requirement(currentSession))) {
			throw new Error('Forbidden');
		}

		predicateCheckMock();
		return fn(currentSession);
	},
}));

describe('studentStatusesService.respond', () => {
	beforeEach(() => {
		currentSession = {
			permissions: [{ resource: 'student-statuses', action: 'approve' }],
			session: {
				id: 'session-1',
				userId: 'finance-1',
				expiresAt: new Date(),
				token: 'token',
				createdAt: new Date(),
				updatedAt: new Date(),
				ipAddress: null,
				userAgent: null,
			},
			user: {
				id: 'finance-1',
				email: 'finance@example.com',
				emailVerified: true,
				name: 'Finance User',
				image: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				role: 'finance',
				presetId: null,
				presetName: null,
				stdNo: null,
			},
		} as Session;
		deleteFileMock.mockReset();
		uploadFileMock.mockReset();
		findApprovalByIdMock.mockReset();
		respondToApprovalMock.mockReset();
		getApprovalsByAppIdMock.mockReset();
		findByIdMock.mockReset();
		predicateCheckMock.mockReset();
		updateForStatusWorkflowMock.mockReset();
		updateStudentSemesterForStatusWorkflowMock.mockReset();
	});

	it('allows approve-only finance users to reject a finance approval step', async () => {
		findApprovalByIdMock.mockResolvedValue({
			id: 'approval-1',
			approverRole: 'finance',
			application: {
				id: 'status-1',
				stdNo: 1001,
				status: 'pending',
			},
		});
		respondToApprovalMock.mockResolvedValue({
			id: 'approval-1',
			status: 'rejected',
		});
		findByIdMock.mockResolvedValue({
			id: 'status-1',
			status: 'pending',
		});

		const { studentStatusesService } = await import('../service');
		const result = await studentStatusesService.respond(
			'approval-1',
			'rejected',
			'Insufficient support'
		);

		expect(findApprovalByIdMock).toHaveBeenCalledWith('approval-1');
		expect(respondToApprovalMock).toHaveBeenCalledWith(
			'approval-1',
			{
				status: 'rejected',
				respondedBy: 'finance-1',
				comments: 'Insufficient support',
			},
			expect.objectContaining({
				userId: 'finance-1',
				role: 'finance',
				activityType: 'student_status_rejected',
				stdNo: 1001,
			})
		);
		expect(result).toEqual({
			id: 'status-1',
			status: 'pending',
		});
		expect(predicateCheckMock).toHaveBeenCalledTimes(1);
		expect(updateForStatusWorkflowMock).not.toHaveBeenCalled();
		expect(updateStudentSemesterForStatusWorkflowMock).not.toHaveBeenCalled();
	});

	it('allows approve-only finance users to approve a finance approval step', async () => {
		findApprovalByIdMock.mockResolvedValue({
			id: 'approval-1',
			approverRole: 'finance',
			application: {
				id: 'status-1',
				stdNo: 1001,
				status: 'pending',
				type: 'deferment',
				semesterId: 22,
			},
		});
		respondToApprovalMock.mockResolvedValue({
			id: 'approval-1',
			status: 'approved',
		});
		getApprovalsByAppIdMock.mockResolvedValue([
			{ status: 'approved' },
			{ status: 'pending' },
		]);
		findByIdMock.mockResolvedValue({
			id: 'status-1',
			status: 'pending',
		});

		const { studentStatusesService } = await import('../service');
		const result = await studentStatusesService.respond(
			'approval-1',
			'approved',
			'Approved by finance'
		);

		expect(findApprovalByIdMock).toHaveBeenCalledWith('approval-1');
		expect(respondToApprovalMock).toHaveBeenCalledWith(
			'approval-1',
			{
				status: 'approved',
				respondedBy: 'finance-1',
				comments: 'Approved by finance',
			},
			expect.objectContaining({
				userId: 'finance-1',
				role: 'finance',
				activityType: 'student_status_approved',
				stdNo: 1001,
			})
		);
		expect(getApprovalsByAppIdMock).toHaveBeenCalledWith('status-1');
		expect(result).toEqual({
			id: 'status-1',
			status: 'pending',
		});
		expect(predicateCheckMock).toHaveBeenCalledTimes(1);
	});
});
