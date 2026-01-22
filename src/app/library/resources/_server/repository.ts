import { and, desc, eq, sql } from 'drizzle-orm';
import { db, libraryResources } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';
import type { ResourceType } from '../_lib/types';

export default class ResourceRepository extends BaseRepository<
	typeof libraryResources,
	'id'
> {
	constructor() {
		super(libraryResources, libraryResources.id);
	}

	async findByIdWithRelations(id: string) {
		return db.query.libraryResources.findFirst({
			where: eq(libraryResources.id, id),
			with: {
				document: true,
				uploadedByUser: {
					columns: { id: true, name: true },
				},
			},
		});
	}

	async findByType(type: ResourceType) {
		return db.query.libraryResources.findMany({
			where: eq(libraryResources.type, type),
			with: {
				document: true,
				uploadedByUser: {
					columns: { id: true, name: true },
				},
			},
			orderBy: desc(libraryResources.createdAt),
		});
	}

	async search(query: string, type?: ResourceType) {
		const conditions = [sql`${libraryResources.title} ILIKE ${`%${query}%`}`];

		if (type) {
			conditions.push(eq(libraryResources.type, type));
		}

		return db.query.libraryResources.findMany({
			where: and(...conditions),
			with: {
				document: true,
				uploadedByUser: {
					columns: { id: true, name: true },
				},
			},
			orderBy: desc(libraryResources.createdAt),
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
			conditions.push(eq(libraryResources.type, type));
		}
		if (search) {
			conditions.push(sql`${libraryResources.title} ILIKE ${`%${search}%`}`);
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const data = await db.query.libraryResources.findMany({
			where: whereClause,
			with: {
				document: true,
				uploadedByUser: {
					columns: { id: true, name: true },
				},
			},
			orderBy: desc(libraryResources.createdAt),
			limit: pageSize,
			offset,
		});

		const [{ count: total }] = await db
			.select({ count: sql<number>`count(*)` })
			.from(libraryResources)
			.where(whereClause);

		return {
			items: data,
			totalPages: Math.ceil(Number(total) / pageSize),
		};
	}
}
