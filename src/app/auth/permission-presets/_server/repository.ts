import { count, eq, getTableColumns, type InferInsertModel } from 'drizzle-orm';
import {
	ACTIONS,
	type Action,
	type PermissionGrant,
	RESOURCES,
	type Resource,
} from '@/core/auth/permissions';
import { db, permissionPresets, presetPermissions } from '@/core/database';
import BaseRepository, {
	type AuditOptions,
	type QueryOptions,
} from '@/core/platform/BaseRepository';
import {
	dashboardRoleSchema,
	type PermissionPresetDetail,
	type PermissionPresetListItem,
} from '../_lib/types';

function isResource(value: string): value is Resource {
	return RESOURCES.includes(value as Resource);
}

function isAction(value: string): value is Action {
	return ACTIONS.includes(value as Action);
}

function isPermissionGrant(value: {
	resource: string | null;
	action: string | null;
}): value is PermissionGrant {
	return (
		value.resource !== null &&
		value.action !== null &&
		isResource(value.resource) &&
		isAction(value.action)
	);
}

function normalizePresetRow<T extends { role: string }>(preset: T) {
	return {
		...preset,
		role: dashboardRoleSchema.parse(preset.role),
	};
}

type PresetInsert = InferInsertModel<typeof permissionPresets>;

export default class PermissionPresetRepository extends BaseRepository<
	typeof permissionPresets,
	'id'
> {
	constructor() {
		super(permissionPresets, permissionPresets.id);
	}

	private buildPermissionRows(
		presetId: string,
		permissions: PermissionGrant[]
	) {
		return permissions.map((permission) => ({
			presetId,
			resource: permission.resource,
			action: permission.action,
		}));
	}

	async findByIdWithPermissions(
		id: string
	): Promise<PermissionPresetDetail | null> {
		const rows = await db
			.select({
				...getTableColumns(permissionPresets),
				resource: presetPermissions.resource,
				action: presetPermissions.action,
			})
			.from(permissionPresets)
			.leftJoin(
				presetPermissions,
				eq(presetPermissions.presetId, permissionPresets.id)
			)
			.where(eq(permissionPresets.id, id));

		if (rows.length === 0) {
			return null;
		}

		const [{ resource: _resource, action: _action, ...preset }] = rows;
		const permissions = rows
			.filter((row) => isPermissionGrant(row))
			.map((row) => ({
				resource: row.resource,
				action: row.action,
			}));

		return {
			...normalizePresetRow(preset),
			permissions,
			permissionCount: permissions.length,
		};
	}

	async findByRole(role: string): Promise<PermissionPresetListItem[]> {
		const rows = await db
			.select({
				...getTableColumns(permissionPresets),
				permissionCount: count(presetPermissions.id),
			})
			.from(permissionPresets)
			.leftJoin(
				presetPermissions,
				eq(presetPermissions.presetId, permissionPresets.id)
			)
			.where(eq(permissionPresets.role, role))
			.groupBy(
				permissionPresets.id,
				permissionPresets.name,
				permissionPresets.role,
				permissionPresets.description,
				permissionPresets.createdAt,
				permissionPresets.updatedAt
			)
			.orderBy(permissionPresets.name);

		return rows.map((row) => normalizePresetRow(row));
	}

	async queryWithPermissionCounts(
		options: QueryOptions<typeof permissionPresets>
	): Promise<{
		items: PermissionPresetListItem[];
		totalPages: number;
		totalItems: number;
	}> {
		const { orderBy, where, offset, limit } = this.buildQueryCriteria(options);

		const items = await db
			.select({
				...getTableColumns(permissionPresets),
				permissionCount: count(presetPermissions.id),
			})
			.from(permissionPresets)
			.leftJoin(
				presetPermissions,
				eq(presetPermissions.presetId, permissionPresets.id)
			)
			.where(where)
			.groupBy(
				permissionPresets.id,
				permissionPresets.name,
				permissionPresets.role,
				permissionPresets.description,
				permissionPresets.createdAt,
				permissionPresets.updatedAt
			)
			.orderBy(...orderBy)
			.limit(limit)
			.offset(offset);

		return this.createPaginatedResult(
			items.map((row) => normalizePresetRow(row)),
			{ where, limit }
		);
	}

	async createWithPermissions(
		data: PresetInsert,
		permissions: PermissionGrant[],
		audit?: AuditOptions
	): Promise<PermissionPresetDetail> {
		if (!audit) {
			return db.transaction(async (tx) => {
				const [created] = await tx
					.insert(permissionPresets)
					.values(data)
					.returning();

				if (permissions.length > 0) {
					await tx
						.insert(presetPermissions)
						.values(this.buildPermissionRows(created.id, permissions));
				}

				return {
					...normalizePresetRow(created),
					permissions,
					permissionCount: permissions.length,
				};
			});
		}

		return db.transaction(async (tx) => {
			const [created] = await tx
				.insert(permissionPresets)
				.values(data)
				.returning();

			if (permissions.length > 0) {
				await tx
					.insert(presetPermissions)
					.values(this.buildPermissionRows(created.id, permissions));
			}

			const next = {
				...normalizePresetRow(created),
				permissions,
				permissionCount: permissions.length,
			};

			await this.writeAuditLog(tx, 'INSERT', created.id, null, next, audit);

			return next;
		});
	}

	async updateWithPermissions(
		id: string,
		data: Partial<PresetInsert>,
		permissions: PermissionGrant[],
		audit?: AuditOptions
	): Promise<PermissionPresetDetail> {
		if (!audit) {
			return db.transaction(async (tx) => {
				const [updated] = await tx
					.update(permissionPresets)
					.set(data)
					.where(eq(permissionPresets.id, id))
					.returning();

				await tx
					.delete(presetPermissions)
					.where(eq(presetPermissions.presetId, id));

				if (permissions.length > 0) {
					await tx
						.insert(presetPermissions)
						.values(this.buildPermissionRows(id, permissions));
				}

				return {
					...normalizePresetRow(updated),
					permissions,
					permissionCount: permissions.length,
				};
			});
		}

		return db.transaction(async (tx) => {
			const before = await this.findByIdWithPermissions(id);
			const [updated] = await tx
				.update(permissionPresets)
				.set(data)
				.where(eq(permissionPresets.id, id))
				.returning();

			await tx
				.delete(presetPermissions)
				.where(eq(presetPermissions.presetId, id));

			if (permissions.length > 0) {
				await tx
					.insert(presetPermissions)
					.values(this.buildPermissionRows(id, permissions));
			}

			const next = {
				...normalizePresetRow(updated),
				permissions,
				permissionCount: permissions.length,
			};

			await this.writeAuditLog(tx, 'UPDATE', id, before, next, audit);

			return next;
		});
	}

	override async deleteById(
		id: string,
		audit?: AuditOptions
	): Promise<boolean> {
		if (!audit) {
			const result = await db
				.delete(permissionPresets)
				.where(eq(permissionPresets.id, id))
				.returning();
			return result.length > 0;
		}

		return db.transaction(async (tx) => {
			const before = await this.findByIdWithPermissions(id);
			const result = await tx
				.delete(permissionPresets)
				.where(eq(permissionPresets.id, id))
				.returning();

			if (before) {
				await this.writeAuditLog(tx, 'DELETE', id, before, null, audit);
			}

			return result.length > 0;
		});
	}
}

export async function listPresetPermissions(
	presetId: string
): Promise<PermissionGrant[]> {
	const rows = await db
		.select({
			resource: presetPermissions.resource,
			action: presetPermissions.action,
		})
		.from(presetPermissions)
		.where(eq(presetPermissions.presetId, presetId));

	return rows.filter((row): row is PermissionGrant => {
		return isResource(row.resource) && isAction(row.action);
	});
}
