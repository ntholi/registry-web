import { and, desc, eq, sql } from 'drizzle-orm';
import { db, digitalResources } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';
import type { ResourceType } from '../_lib/types';

export default class ResourceRepository extends BaseRepository<
	typeof digitalResources,
	'id'
> {
	constructor() {
		super(digitalResources, digitalResources.id);
	}

	async findByIdWithRelations(id: number) {
		return db.query.digitalResources.findFirst({
			where: eq(digitalResources.id, id),
			with: {
				uploadedByUser: {
					columns: { id: true, name: true },
				},
			},
		});
	}

	async findByType(type: ResourceType) {
		return db.query.digitalResources.findMany({
			where: eq(digitalResources.type, type),
			with: {
				uploadedByUser: {
					columns: { id: true, name: true },
				},
			},
			orderBy: desc(digitalResources.createdAt),
		});
	}

	async search(query: string, type?: ResourceType) {
		const conditions = [sql`${digitalResources.title} ILIKE ${`%${query}%`}`];

		if (type) {
			conditions.push(eq(digitalResources.type, type));
		}

		return db.query.digitalResources.findMany({
			where: and(...conditions),
			with: {
				uploadedByUser: {
					columns: { id: true, name: true },
				},
			},
			orderBy: desc(digitalResources.createdAt),
		});
	}

	async getResourcesWithFilters(
		page: number,
		search: string,
		type?: ResourceType
	) {
		const pageSize = 15;
		const offset = (page - 1) * pageSize;

		const conditions = [];
		if (type) {
			conditions.push(eq(digitalResources.type, type));
		}
		if (search) {
			conditions.push(sql`${digitalResources.title} ILIKE ${`%${search}%`}`);
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const data = await db.query.digitalResources.findMany({
			where: whereClause,
			with: {
				uploadedByUser: {
					columns: { id: true, name: true },
				},
			},
			orderBy: desc(digitalResources.createdAt),
			limit: pageSize,
			offset,
		});

		const [{ count: total }] = await db
			.select({ count: sql<number>`count(*)` })
			.from(digitalResources)
			.where(whereClause);

		return {
			items: data,
			totalPages: Math.ceil(Number(total) / pageSize),
		};
	}
}
