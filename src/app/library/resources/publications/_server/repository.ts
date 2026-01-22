import { and, desc, eq, sql } from 'drizzle-orm';
import { db, publications } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';
import type { PublicationType } from '../_schema/publications';

export default class PublicationRepository extends BaseRepository<
	typeof publications,
	'id'
> {
	constructor() {
		super(publications, publications.id);
	}

	async findByIdWithRelations(id: string) {
		return db.query.publications.findFirst({
			where: eq(publications.id, id),
			with: {
				document: true,
				publicationAuthors: {
					with: {
						author: true,
					},
				},
			},
		});
	}

	async getPublicationsWithFilters(
		page: number,
		search: string,
		type?: PublicationType
	) {
		const pageSize = 15;
		const offset = (page - 1) * pageSize;

		const conditions = [];
		if (type) {
			conditions.push(eq(publications.type, type));
		}
		if (search) {
			conditions.push(sql`${publications.title} ILIKE ${`%${search}%`}`);
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const data = await db.query.publications.findMany({
			where: whereClause,
			with: {
				document: true,
				publicationAuthors: {
					with: {
						author: true,
					},
				},
			},
			orderBy: desc(publications.createdAt),
			limit: pageSize,
			offset,
		});

		const [countResult] = await db
			.select({ count: sql<number>`count(*)` })
			.from(publications)
			.where(whereClause);

		return {
			items: data,
			totalPages: Math.ceil((countResult?.count || 0) / pageSize),
			totalItems: countResult?.count || 0,
		};
	}
}

export const publicationsRepository = new PublicationRepository();
