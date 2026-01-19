import { count, eq, ilike, or } from 'drizzle-orm';
import {
	academicRecords,
	certificateTypes,
	db,
	entryRequirements,
	gradeMappings,
} from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class CertificateTypeRepository extends BaseRepository<
	typeof certificateTypes,
	'id'
> {
	constructor() {
		super(certificateTypes, certificateTypes.id);
	}

	override async findById(id: string) {
		return db.query.certificateTypes.findFirst({
			where: eq(certificateTypes.id, id),
			with: { gradeMappings: true },
		});
	}

	async findByName(name: string) {
		return db.query.certificateTypes.findFirst({
			where: eq(certificateTypes.name, name),
		});
	}

	async search(page: number, search: string) {
		const pageSize = 15;
		const offset = (page - 1) * pageSize;

		const where = search
			? or(
					ilike(certificateTypes.name, `%${search}%`),
					ilike(certificateTypes.description, `%${search}%`)
				)
			: undefined;

		const [items, [{ total }]] = await Promise.all([
			db.query.certificateTypes.findMany({
				where,
				limit: pageSize,
				offset,
				orderBy: (ct, { asc }) => [asc(ct.name)],
				with: { gradeMappings: true },
			}),
			db
				.select({ total: count() })
				.from(certificateTypes)
				.where(where ?? undefined),
		]);

		return {
			items,
			totalPages: Math.ceil(total / pageSize),
			totalItems: total,
		};
	}

	async isInUse(id: string): Promise<boolean> {
		const [academicRecordCount, entryRequirementCount] = await Promise.all([
			db
				.select({ total: count() })
				.from(academicRecords)
				.where(eq(academicRecords.certificateTypeId, id)),
			db
				.select({ total: count() })
				.from(entryRequirements)
				.where(eq(entryRequirements.certificateTypeId, id)),
		]);
		return (
			academicRecordCount[0].total > 0 || entryRequirementCount[0].total > 0
		);
	}

	async createWithMappings(
		data: typeof certificateTypes.$inferInsert,
		mappings?: Array<{
			originalGrade: string;
			standardGrade: (typeof gradeMappings.$inferInsert)['standardGrade'];
		}>
	) {
		return db.transaction(async (tx) => {
			const [certType] = await tx
				.insert(certificateTypes)
				.values(data)
				.returning();

			if (mappings && mappings.length > 0) {
				await tx.insert(gradeMappings).values(
					mappings.map((m) => ({
						certificateTypeId: certType.id,
						originalGrade: m.originalGrade,
						standardGrade: m.standardGrade,
					}))
				);
			}

			return tx.query.certificateTypes.findFirst({
				where: eq(certificateTypes.id, certType.id),
				with: { gradeMappings: true },
			});
		});
	}

	async updateWithMappings(
		id: string,
		data: Partial<typeof certificateTypes.$inferInsert>,
		mappings?: Array<{
			originalGrade: string;
			standardGrade: (typeof gradeMappings.$inferInsert)['standardGrade'];
		}>
	) {
		return db.transaction(async (tx) => {
			await tx
				.update(certificateTypes)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(certificateTypes.id, id));

			if (mappings !== undefined) {
				await tx
					.delete(gradeMappings)
					.where(eq(gradeMappings.certificateTypeId, id));

				if (mappings.length > 0) {
					await tx.insert(gradeMappings).values(
						mappings.map((m) => ({
							certificateTypeId: id,
							originalGrade: m.originalGrade,
							standardGrade: m.standardGrade,
						}))
					);
				}
			}

			return tx.query.certificateTypes.findFirst({
				where: eq(certificateTypes.id, id),
				with: { gradeMappings: true },
			});
		});
	}

	async removeById(id: string) {
		await db.delete(certificateTypes).where(eq(certificateTypes.id, id));
	}
}
