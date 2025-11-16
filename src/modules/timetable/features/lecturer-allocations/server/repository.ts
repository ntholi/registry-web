import { and, eq } from 'drizzle-orm';
import { db, lecturerAllocations } from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export type LecturerAllocationInsert = typeof lecturerAllocations.$inferInsert;
export type LecturerAllocationQueryOptions = QueryOptions<
	typeof lecturerAllocations
>;

export default class LecturerAllocationRepository extends BaseRepository<
	typeof lecturerAllocations,
	'id'
> {
	constructor() {
		super(lecturerAllocations, lecturerAllocations.id);
	}

	async findByIdWithRelations(id: number) {
		return db.query.lecturerAllocations.findFirst({
			where: eq(lecturerAllocations.id, id),
			with: {
				user: true,
				semesterModule: {
					with: {
						module: true,
						semester: {
							with: {
								structure: {
									with: {
										program: true,
									},
								},
							},
						},
					},
				},
				term: true,
			},
		});
	}

	async findAllWithRelations() {
		return db.query.lecturerAllocations.findMany({
			with: {
				user: true,
				semesterModule: {
					with: {
						module: true,
						semester: true,
					},
				},
				term: true,
			},
			orderBy: (lecturerAllocations, { desc }) => [
				desc(lecturerAllocations.createdAt),
			],
		});
	}

	async findByUserAndTerm(userId: string, termId: number) {
		return db.query.lecturerAllocations.findMany({
			where: and(
				eq(lecturerAllocations.userId, userId),
				eq(lecturerAllocations.termId, termId)
			),
			with: {
				semesterModule: {
					with: {
						module: true,
						semester: true,
					},
				},
			},
		});
	}

	async findByUserIdWithRelations(userId: string) {
		return db.query.lecturerAllocations.findMany({
			where: eq(lecturerAllocations.userId, userId),
			with: {
				user: true,
				semesterModule: {
					with: {
						module: true,
						semester: {
							with: {
								structure: {
									with: {
										program: true,
									},
								},
							},
						},
					},
				},
				term: true,
			},
			orderBy: (lecturerAllocations, { desc }) => [
				desc(lecturerAllocations.createdAt),
			],
		});
	}

	async findUniqueLecturers() {
		const allocations = await db.query.lecturerAllocations.findMany({
			with: {
				user: true,
			},
			orderBy: (lecturerAllocations, { desc }) => [
				desc(lecturerAllocations.createdAt),
			],
		});

		const uniqueLecturers = new Map();
		for (const allocation of allocations) {
			if (!uniqueLecturers.has(allocation.userId)) {
				uniqueLecturers.set(allocation.userId, allocation.user);
			}
		}

		return Array.from(uniqueLecturers.entries()).map(([userId, user]) => ({
			userId,
			user,
		}));
	}

	async findLecturersByTerm(termId: number) {
		const allocations = await db.query.lecturerAllocations.findMany({
			where: eq(lecturerAllocations.termId, termId),
			with: {
				user: true,
			},
			orderBy: (lecturerAllocations, { desc }) => [
				desc(lecturerAllocations.createdAt),
			],
		});

		const uniqueLecturers = new Map();
		for (const allocation of allocations) {
			if (!uniqueLecturers.has(allocation.userId)) {
				uniqueLecturers.set(allocation.userId, allocation.user);
			}
		}

		return Array.from(uniqueLecturers.entries()).map(([userId, user]) => ({
			userId,
			user,
		}));
	}

	async createMany(allocations: LecturerAllocationInsert[]) {
		return db.insert(lecturerAllocations).values(allocations).returning();
	}

	async deleteByUserAndTerm(userId: string, termId: number) {
		return db
			.delete(lecturerAllocations)
			.where(
				and(
					eq(lecturerAllocations.userId, userId),
					eq(lecturerAllocations.termId, termId)
				)
			)
			.returning();
	}
}

export const lecturerAllocationRepository = new LecturerAllocationRepository();
