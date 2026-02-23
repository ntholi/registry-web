import { and, count, eq, isNull, or, type SQL, sql } from 'drizzle-orm';
import type { DocumentType, DocumentVerificationStatus } from '@/core/database';
import {
	academicRecords,
	applicantDocuments,
	applicants,
	certificateTypes,
	db,
	documents,
	gradeMappings,
	subjectGrades,
} from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

const LOCK_EXPIRY_MS = 5 * 60 * 1000;

export default class DocumentReviewRepository extends BaseRepository<
	typeof applicantDocuments,
	'id'
> {
	constructor() {
		super(applicantDocuments, applicantDocuments.id);
	}

	async countPending() {
		const [row] = await db
			.select({ total: count() })
			.from(applicantDocuments)
			.where(eq(applicantDocuments.verificationStatus, 'pending'));
		return row?.total ?? 0;
	}

	async findAllForReview(
		page: number,
		search: string,
		filters?: {
			status?: DocumentVerificationStatus;
			type?: DocumentType;
		},
		currentUserId?: string
	) {
		const pageSize = 15;
		const offset = (page - 1) * pageSize;

		const conditions: SQL[] = [];

		const notLockedByOthers = or(
			isNull(applicantDocuments.reviewLockedBy),
			currentUserId
				? eq(applicantDocuments.reviewLockedBy, currentUserId)
				: sql`false`,
			sql`${applicantDocuments.reviewLockedAt} < NOW() - INTERVAL '${sql.raw(String(LOCK_EXPIRY_MS / 1000))} seconds'`
		)!;
		conditions.push(notLockedByOthers);

		if (filters?.status) {
			conditions.push(
				eq(applicantDocuments.verificationStatus, filters.status)
			);
		}
		if (filters?.type) {
			conditions.push(eq(documents.type, filters.type));
		}
		if (search) {
			conditions.push(
				or(
					sql`${applicants.fullName}::text ILIKE ${`%${search}%`}`,
					sql`${applicants.nationalId}::text ILIKE ${`%${search}%`}`,
					sql`${documents.fileName}::text ILIKE ${`%${search}%`}`
				)!
			);
		}

		const where =
			conditions.length > 0
				? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}`
				: undefined;

		const baseQuery = db
			.select({
				id: applicantDocuments.id,
				verificationStatus: applicantDocuments.verificationStatus,
				applicantId: applicantDocuments.applicantId,
				documentId: applicantDocuments.documentId,
				applicantName: applicants.fullName,
				documentType: documents.type,
				fileName: documents.fileName,
				fileUrl: documents.fileUrl,
				createdAt: documents.createdAt,
			})
			.from(applicantDocuments)
			.innerJoin(documents, eq(applicantDocuments.documentId, documents.id))
			.innerJoin(applicants, eq(applicantDocuments.applicantId, applicants.id));

		const countQuery = db
			.select({ total: count() })
			.from(applicantDocuments)
			.innerJoin(documents, eq(applicantDocuments.documentId, documents.id))
			.innerJoin(applicants, eq(applicantDocuments.applicantId, applicants.id));

		const [items, [{ total }]] = await Promise.all([
			where
				? baseQuery
						.where(where)
						.orderBy(sql`${documents.createdAt} DESC`)
						.limit(pageSize)
						.offset(offset)
				: baseQuery
						.orderBy(sql`${documents.createdAt} DESC`)
						.limit(pageSize)
						.offset(offset),
			where ? countQuery.where(where) : countQuery,
		]);

		return {
			items,
			totalPages: Math.ceil(total / pageSize),
			totalItems: total,
		};
	}

	async findByIdWithRelations(id: string) {
		const appDoc = await db.query.applicantDocuments.findFirst({
			where: eq(applicantDocuments.id, id),
			with: {
				document: true,
				applicant: true,
			},
		});

		if (!appDoc) return null;

		const records = await db.query.academicRecords.findMany({
			where: eq(academicRecords.applicantDocumentId, id),
			with: {
				certificateType: { with: { gradeMappings: true } },
				subjectGrades: { with: { subject: true } },
			},
		});

		return { ...appDoc, academicRecords: records };
	}

	async updateRotation(id: string, rotation: number) {
		const [doc] = await db
			.update(applicantDocuments)
			.set({ rotation })
			.where(eq(applicantDocuments.id, id))
			.returning();
		return doc;
	}

	async updateVerificationStatus(
		id: string,
		status: DocumentVerificationStatus,
		rejectionReason?: string
	) {
		const [doc] = await db
			.update(applicantDocuments)
			.set({
				verificationStatus: status,
				rejectionReason: status === 'rejected' ? rejectionReason : null,
			})
			.where(eq(applicantDocuments.id, id))
			.returning();
		return doc;
	}

	async updateApplicantField(
		applicantId: string,
		field: string,
		value: string | null
	) {
		const [updated] = await db
			.update(applicants)
			.set({ [field]: value, updatedAt: new Date() })
			.where(eq(applicants.id, applicantId))
			.returning();
		return updated;
	}

	async updateAcademicRecordField(
		recordId: string,
		field: string,
		value: string | number | null
	) {
		const [updated] = await db
			.update(academicRecords)
			.set({ [field]: value, updatedAt: new Date() })
			.where(eq(academicRecords.id, recordId))
			.returning();
		return updated;
	}

	async updateSubjectGradeField(
		gradeId: string,
		field: 'originalGrade' | 'standardGrade',
		value: string | null
	) {
		return db.transaction(async (tx) => {
			if (field === 'originalGrade') {
				const originalGrade = (value ?? '').trim();

				const [gradeCtx] = await tx
					.select({
						lqfLevel: certificateTypes.lqfLevel,
						mappedStandardGrade: gradeMappings.standardGrade,
					})
					.from(subjectGrades)
					.innerJoin(
						academicRecords,
						eq(academicRecords.id, subjectGrades.academicRecordId)
					)
					.innerJoin(
						certificateTypes,
						eq(certificateTypes.id, academicRecords.certificateTypeId)
					)
					.leftJoin(
						gradeMappings,
						and(
							eq(
								gradeMappings.certificateTypeId,
								academicRecords.certificateTypeId
							),
							eq(gradeMappings.originalGrade, originalGrade)
						)
					)
					.where(eq(subjectGrades.id, gradeId))
					.limit(1);

				if (!gradeCtx) {
					return null;
				}

				const [updated] = await tx
					.update(subjectGrades)
					.set(
						gradeCtx.lqfLevel === 4
							? {
									originalGrade,
									standardGrade: gradeCtx.mappedStandardGrade,
								}
							: { originalGrade }
					)
					.where(eq(subjectGrades.id, gradeId))
					.returning();

				return updated;
			}

			const [gradeCtx] = await tx
				.select({ lqfLevel: certificateTypes.lqfLevel })
				.from(subjectGrades)
				.innerJoin(
					academicRecords,
					eq(academicRecords.id, subjectGrades.academicRecordId)
				)
				.innerJoin(
					certificateTypes,
					eq(certificateTypes.id, academicRecords.certificateTypeId)
				)
				.where(eq(subjectGrades.id, gradeId))
				.limit(1);

			if (!gradeCtx) {
				return null;
			}

			if (gradeCtx.lqfLevel === 4) {
				return tx.query.subjectGrades.findFirst({
					where: eq(subjectGrades.id, gradeId),
				});
			}

			const [updated] = await tx
				.update(subjectGrades)
				.set({
					standardGrade:
						value as (typeof subjectGrades.$inferInsert)['standardGrade'],
				})
				.where(eq(subjectGrades.id, gradeId))
				.returning();

			return updated;
		});
	}

	async acquireLock(documentId: string, userId: string) {
		const [doc] = await db
			.update(applicantDocuments)
			.set({
				reviewLockedBy: userId,
				reviewLockedAt: new Date(),
			})
			.where(
				and(
					eq(applicantDocuments.id, documentId),
					or(
						isNull(applicantDocuments.reviewLockedBy),
						eq(applicantDocuments.reviewLockedBy, userId),
						sql`${applicantDocuments.reviewLockedAt} < NOW() - INTERVAL '${sql.raw(String(LOCK_EXPIRY_MS / 1000))} seconds'`
					)
				)
			)
			.returning();
		return doc ?? null;
	}

	async releaseLock(documentId: string, userId: string) {
		const [doc] = await db
			.update(applicantDocuments)
			.set({
				reviewLockedBy: null,
				reviewLockedAt: null,
			})
			.where(
				and(
					eq(applicantDocuments.id, documentId),
					eq(applicantDocuments.reviewLockedBy, userId)
				)
			)
			.returning();
		return doc ?? null;
	}

	async releaseAllLocks(userId: string) {
		await db
			.update(applicantDocuments)
			.set({
				reviewLockedBy: null,
				reviewLockedAt: null,
			})
			.where(eq(applicantDocuments.reviewLockedBy, userId));
	}

	async findNextUnlocked(
		currentId: string,
		userId: string,
		filters?: {
			status?: DocumentVerificationStatus;
			type?: DocumentType;
		}
	) {
		const conditions: SQL[] = [
			sql`${applicantDocuments.id} != ${currentId}`,
			or(
				isNull(applicantDocuments.reviewLockedBy),
				eq(applicantDocuments.reviewLockedBy, userId),
				sql`${applicantDocuments.reviewLockedAt} < NOW() - INTERVAL '${sql.raw(String(LOCK_EXPIRY_MS / 1000))} seconds'`
			)!,
		];

		if (filters?.status) {
			conditions.push(
				eq(applicantDocuments.verificationStatus, filters.status)
			);
		}
		if (filters?.type) {
			conditions.push(eq(documents.type, filters.type));
		}

		const where = conditions.reduce((a, b) => sql`${a} AND ${b}`);

		const [next] = await db
			.select({ id: applicantDocuments.id })
			.from(applicantDocuments)
			.innerJoin(documents, eq(applicantDocuments.documentId, documents.id))
			.where(where)
			.orderBy(sql`${documents.createdAt} DESC`)
			.limit(1);

		return next ?? null;
	}
}
