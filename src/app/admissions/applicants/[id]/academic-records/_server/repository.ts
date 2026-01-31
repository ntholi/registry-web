import type { StandardGrade } from '@admissions/_database';
import { and, count, eq, isNotNull } from 'drizzle-orm';
import { academicRecords, db, subjectGrades } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class AcademicRecordRepository extends BaseRepository<
	typeof academicRecords,
	'id'
> {
	constructor() {
		super(academicRecords, academicRecords.id);
	}

	override async findById(id: string) {
		return db.query.academicRecords.findFirst({
			where: eq(academicRecords.id, id),
			with: {
				certificateType: true,
				subjectGrades: { with: { subject: true } },
				applicantDocument: { with: { document: true } },
			},
		});
	}

	async findByApplicant(applicantId: string, page = 1) {
		const pageSize = 15;
		const offset = (page - 1) * pageSize;

		const [items, [{ total }]] = await Promise.all([
			db.query.academicRecords.findMany({
				where: eq(academicRecords.applicantId, applicantId),
				limit: pageSize,
				offset,
				orderBy: (r, { desc }) => [desc(r.examYear)],
				with: {
					certificateType: true,
					subjectGrades: { with: { subject: true } },
					applicantDocument: { with: { document: true } },
				},
			}),
			db
				.select({ total: count() })
				.from(academicRecords)
				.where(eq(academicRecords.applicantId, applicantId)),
		]);

		return {
			items,
			totalPages: Math.ceil(total / pageSize),
			totalItems: total,
		};
	}

	async createWithGrades(
		data: typeof academicRecords.$inferInsert,
		grades?: {
			subjectId: string;
			originalGrade: string;
			standardGrade: StandardGrade | null;
		}[]
	) {
		return db.transaction(async (tx) => {
			const [record] = await tx
				.insert(academicRecords)
				.values(data)
				.returning();

			if (grades && grades.length > 0) {
				await tx.insert(subjectGrades).values(
					grades.map((g) => ({
						academicRecordId: record.id,
						subjectId: g.subjectId,
						originalGrade: g.originalGrade,
						standardGrade: g.standardGrade,
					}))
				);
			}

			return tx.query.academicRecords.findFirst({
				where: eq(academicRecords.id, record.id),
				with: {
					certificateType: true,
					subjectGrades: { with: { subject: true } },
					applicantDocument: { with: { document: true } },
				},
			});
		});
	}

	async updateWithGrades(
		id: string,
		data: Partial<typeof academicRecords.$inferInsert>,
		grades?: {
			subjectId: string;
			originalGrade: string;
			standardGrade: StandardGrade | null;
		}[]
	) {
		return db.transaction(async (tx) => {
			await tx
				.update(academicRecords)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(academicRecords.id, id));

			if (grades !== undefined) {
				await tx
					.delete(subjectGrades)
					.where(eq(subjectGrades.academicRecordId, id));

				if (grades.length > 0) {
					await tx.insert(subjectGrades).values(
						grades.map((g) => ({
							academicRecordId: id,
							subjectId: g.subjectId,
							originalGrade: g.originalGrade,
							standardGrade: g.standardGrade,
						}))
					);
				}
			}

			return tx.query.academicRecords.findFirst({
				where: eq(academicRecords.id, id),
				with: {
					certificateType: true,
					subjectGrades: { with: { subject: true } },
					applicantDocument: { with: { document: true } },
				},
			});
		});
	}

	async removeById(id: string) {
		await db.delete(academicRecords).where(eq(academicRecords.id, id));
	}

	async findByCertificateNumber(certificateNumber: string) {
		return db.query.academicRecords.findFirst({
			where: and(
				eq(academicRecords.certificateNumber, certificateNumber),
				isNotNull(academicRecords.certificateNumber)
			),
			with: {
				certificateType: true,
				subjectGrades: { with: { subject: true } },
				applicantDocument: { with: { document: true } },
			},
		});
	}

	async linkDocument(academicRecordId: string, applicantDocumentId: string) {
		const [record] = await db
			.update(academicRecords)
			.set({ applicantDocumentId, updatedAt: new Date() })
			.where(eq(academicRecords.id, academicRecordId))
			.returning();
		return record;
	}
}
