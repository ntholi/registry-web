import { beforeEach, describe, expect, it, vi } from 'vitest';

const revokeUserSessionsMock = vi.fn();
const findIdsByPresetIdMock = vi.fn();
const withPermissionMock = vi.fn();
const createWithPermissionsMock = vi.fn();
const findByIdWithPermissionsMock = vi.fn();
const updateWithPermissionsMock = vi.fn();
const deleteByIdMock = vi.fn();

vi.mock('@/core/auth', () => ({
	betterAuthServer: {
		api: {
			revokeUserSessions: revokeUserSessionsMock,
		},
	},
}));

vi.mock('@auth/users/_server/repository', () => ({
	authUsersRepository: {
		findIdsByPresetId: findIdsByPresetIdMock,
	},
}));

vi.mock('@/core/platform/withPermission', () => ({
	withPermission: withPermissionMock,
}));

vi.mock('../repository', () => ({
	default: class PermissionPresetRepository {
		createWithPermissions = createWithPermissionsMock;
		findByIdWithPermissions = findByIdWithPermissionsMock;
		updateWithPermissions = updateWithPermissionsMock;
		deleteById = deleteByIdMock;
	},
}));

describe('permissionPresetService', () => {
	beforeEach(() => {
		vi.resetModules();
		revokeUserSessionsMock.mockReset();
		findIdsByPresetIdMock.mockReset();
		createWithPermissionsMock.mockReset();
		findByIdWithPermissionsMock.mockReset();
		updateWithPermissionsMock.mockReset();
		deleteByIdMock.mockReset();
		withPermissionMock.mockReset();
		withPermissionMock.mockImplementation(async (fn) => {
			return fn({
				user: { id: 'admin-1', role: 'admin', stdNo: null, presetId: null },
				permissions: [],
				session: {
					id: 'sess-1',
					userId: 'admin-1',
					token: 'token',
					expiresAt: new Date(),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});
		});
	});

	it('creates presets with audit metadata through the service layer', async () => {
		createWithPermissionsMock.mockResolvedValue({
			id: 'preset-1',
			name: 'Registry Reviewers',
			role: 'registry',
			description: 'Review registrations',
			permissions: [{ resource: 'students', action: 'read' }],
			permissionCount: 1,
		});

		const { permissionPresetService } = await import('../service');
		const result = await permissionPresetService.create({
			name: 'Registry Reviewers',
			role: 'registry',
			description: 'Review registrations',
			permissions: [{ resource: 'students', action: 'read' }],
		});

		expect(withPermissionMock).toHaveBeenCalledTimes(1);
		expect(createWithPermissionsMock).toHaveBeenCalledWith(
			{
				name: 'Registry Reviewers',
				role: 'registry',
				description: 'Review registrations',
			},
			[{ resource: 'students', action: 'read' }],
			expect.objectContaining({
				userId: 'admin-1',
				role: 'admin',
				activityType: 'preset_created',
			})
		);
		expect(result.permissionCount).toBe(1);
	});

	it('revokes affected sessions when preset permissions change', async () => {
		findByIdWithPermissionsMock.mockResolvedValue({
			id: 'preset-1',
			permissions: [{ resource: 'students', action: 'read' }],
		});
		updateWithPermissionsMock.mockResolvedValue({
			id: 'preset-1',
			permissions: [{ resource: 'students', action: 'delete' }],
		});
		findIdsByPresetIdMock.mockResolvedValue(['user-1', 'user-2']);

		const { permissionPresetService } = await import('../service');
		await permissionPresetService.update('preset-1', {
			name: 'Registry Managers',
			role: 'registry',
			description: undefined,
			permissions: [{ resource: 'students', action: 'delete' }],
		});

		expect(updateWithPermissionsMock).toHaveBeenCalledWith(
			'preset-1',
			{
				name: 'Registry Managers',
				role: 'registry',
				description: null,
			},
			[{ resource: 'students', action: 'delete' }],
			expect.objectContaining({ activityType: 'preset_updated' })
		);
		expect(findIdsByPresetIdMock).toHaveBeenCalledWith('preset-1');
		expect(revokeUserSessionsMock).toHaveBeenCalledTimes(2);
		expect(revokeUserSessionsMock).toHaveBeenNthCalledWith(1, {
			body: { userId: 'user-1' },
		});
		expect(revokeUserSessionsMock).toHaveBeenNthCalledWith(2, {
			body: { userId: 'user-2' },
		});
	});

	it('does not revoke sessions when permissions stay the same', async () => {
		findByIdWithPermissionsMock.mockResolvedValue({
			id: 'preset-1',
			permissions: [{ resource: 'students', action: 'read' }],
		});
		updateWithPermissionsMock.mockResolvedValue({
			id: 'preset-1',
			permissions: [{ resource: 'students', action: 'read' }],
		});

		const { permissionPresetService } = await import('../service');
		await permissionPresetService.update('preset-1', {
			name: 'Registry Reviewers',
			role: 'registry',
			description: 'same',
			permissions: [{ resource: 'students', action: 'read' }],
		});

		expect(findIdsByPresetIdMock).not.toHaveBeenCalled();
		expect(revokeUserSessionsMock).not.toHaveBeenCalled();
	});

	it('revokes linked users when a preset is deleted', async () => {
		findIdsByPresetIdMock.mockResolvedValue(['user-7']);
		deleteByIdMock.mockResolvedValue(true);

		const { permissionPresetService } = await import('../service');
		const result = await permissionPresetService.delete('preset-9');

		expect(deleteByIdMock).toHaveBeenCalledWith(
			'preset-9',
			expect.objectContaining({ activityType: 'preset_deleted' })
		);
		expect(revokeUserSessionsMock).toHaveBeenCalledWith({
			body: { userId: 'user-7' },
		});
		expect(result).toBe(true);
	});
});
