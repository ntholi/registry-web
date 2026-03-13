import { authUsersRepository } from '@auth/users/_server/repository';
import { betterAuthServer } from '@/core/auth';
import type { DashboardRole } from '@/core/auth/permissions';
import type { permissionPresets } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { withPermission } from '@/core/platform/withPermission';
import type { PresetFormValues } from '../_lib/types';
import PermissionPresetRepository from './repository';

function normalizePermissions(data: PresetFormValues['permissions']) {
	return [...data]
		.map((permission) => `${permission.resource}:${permission.action}`)
		.sort();
}

function hasPermissionChanges(
	current: PresetFormValues['permissions'],
	next: PresetFormValues['permissions']
) {
	const left = normalizePermissions(current);
	const right = normalizePermissions(next);

	if (left.length !== right.length) {
		return true;
	}

	return left.some((value, index) => value !== right[index]);
}

class PermissionPresetService extends BaseService<
	typeof permissionPresets,
	'id'
> {
	constructor(private readonly presetRepo = new PermissionPresetRepository()) {
		super(presetRepo, {
			activityTypes: {
				create: 'preset_created',
				update: 'preset_updated',
				delete: 'preset_deleted',
			},
			byIdAuth: { 'permission-presets': ['read'] },
			findAllAuth: { 'permission-presets': ['read'] },
			createAuth: { 'permission-presets': ['create'] },
			updateAuth: { 'permission-presets': ['update'] },
			deleteAuth: { 'permission-presets': ['delete'] },
		});
	}

	override async get(id: string) {
		return withPermission(
			async () => this.presetRepo.findByIdWithPermissions(id),
			{ 'permission-presets': ['read'] }
		);
	}

	async findAllWithCounts(params: QueryOptions<typeof permissionPresets>) {
		return withPermission(
			async () => this.presetRepo.queryWithPermissionCounts(params),
			{ 'permission-presets': ['read'] }
		);
	}

	async findByRole(role: DashboardRole) {
		return withPermission(async () => this.presetRepo.findByRole(role), {
			'permission-presets': ['read'],
		});
	}

	override async create(data: PresetFormValues) {
		return withPermission(
			async (session) => {
				const audit = this.buildAuditOptions(session, 'create');
				return this.presetRepo.createWithPermissions(
					{
						name: data.name,
						role: data.role,
						description: data.description,
					},
					data.permissions,
					audit
				);
			},
			{ 'permission-presets': ['create'] }
		);
	}

	private async revokeAffectedUserSessions(presetId: string) {
		const userIds = await authUsersRepository.findIdsByPresetId(presetId);

		await Promise.all(
			userIds.map((userId) =>
				betterAuthServer.api.revokeUserSessions({ body: { userId } })
			)
		);
	}

	override async update(id: string, data: PresetFormValues) {
		return withPermission(
			async (session) => {
				const audit = this.buildAuditOptions(session, 'update');
				const current = await this.presetRepo.findByIdWithPermissions(id);
				const next = await this.presetRepo.updateWithPermissions(
					id,
					{
						name: data.name,
						role: data.role,
						description: data.description,
					},
					data.permissions,
					audit
				);

				if (
					current &&
					hasPermissionChanges(current.permissions, data.permissions)
				) {
					await this.revokeAffectedUserSessions(id);
				}

				return next;
			},
			{ 'permission-presets': ['update'] }
		);
	}

	override async delete(id: string) {
		return withPermission(
			async (session) => {
				const audit = this.buildAuditOptions(session, 'delete');
				const affectedUserIds = await authUsersRepository.findIdsByPresetId(id);
				const deleted = await this.presetRepo.deleteById(id, audit);

				if (deleted && affectedUserIds.length > 0) {
					await Promise.all(
						affectedUserIds.map((userId) =>
							betterAuthServer.api.revokeUserSessions({ body: { userId } })
						)
					);
				}

				return deleted;
			},
			{ 'permission-presets': ['delete'] }
		);
	}
}

export const permissionPresetService = serviceWrapper(
	PermissionPresetService,
	'PermissionPresetService'
);
