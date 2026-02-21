import { count, eq, or, type SQL, sql } from 'drizzle-orm';
import type { DocumentType, DocumentVerificationStatus } from '@/core/database';
import {
	academicRecords,
	applicantDocuments,
	applicants,
	db,
	documents,
	subjectGrades,
} from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class DocumentReviewRepository extends BaseRepository<
	typeof applicantDocuments,
	'id'
> {
	constructor() {
		super(applicantDocuments, applicantDocuments.id);
	}

	async findAllForReview(
		page: number,
		search: string,
		filters?: {
			status?: DocumentVerificationStatus;
			type?: DocumentType;
		}
	) {
		const pageSize = 15;
		const offset = (page - 1) * pageSize;

		const conditions: SQL[] = [];

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
				certificateType: true,
				subjectGrades: { with: { subject: true } },
			},
		});

		return { ...appDoc, academicRecords: records };
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
		field: string,
		value: string | null
	) {
		const [updated] = await db
			.update(subjectGrades)
			.set({ [field]: value })
			.where(eq(subjectGrades.id, gradeId))
			.returning();
		return updated;
	}
}
