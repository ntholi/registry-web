import { count, eq, ilike, or } from 'drizzle-orm';
import {
	academicRecords,
	applicantDocuments,
	applicantPhones,
	applicants,
	db,
	documents,
	guardianPhones,
	guardians,
	subjectGrades,
	users,
} from '@/core/database';
import type { DocumentAnalysisResult } from '@/core/integrations/ai/documents';
import BaseRepository from '@/core/platform/BaseRepository';

type DocumentInput = {
	fileName: string;
	fileUrl: string;
	type: (typeof documents.$inferInsert)['type'];
	analysisResult: DocumentAnalysisResult;
};

type AcademicRecordInput = {
	certificateTypeId: string;
	examYear: number;
	institutionName: string;
	qualificationName?: string | null;
	certificateNumber?: string | null;
	resultClassification?: (typeof academicRecords.$inferInsert)['resultClassification'];
	subjectGrades?: {
		subjectId: string;
		originalGrade: string;
		standardGrade: (typeof subjectGrades.$inferInsert)['standardGrade'];
	}[];
};

export default class ApplicantRepository extends BaseRepository<
	typeof applicants,
	'id'
> {
	constructor() {
		super(applicants, applicants.id);
	}

	override async findById(id: string) {
		return db.query.applicants.findFirst({
			where: eq(applicants.id, id),
			with: {
				phones: true,
				guardians: { with: { phones: true } },
				academicRecords: {
					with: {
						certificateType: true,
						subjectGrades: { with: { subject: true } },
					},
				},
				documents: { with: { document: true } },
			},
		});
	}

	async findByNationalId(nationalId: string) {
		return db.query.applicants.findFirst({
			where: eq(applicants.nationalId, nationalId),
		});
	}

	async findByUserId(userId: string) {
		return db.query.applicants.findFirst({
			where: eq(applicants.userId, userId),
			with: {
				phones: true,
				guardians: { with: { phones: true } },
				academicRecords: {
					with: {
						certificateType: true,
						subjectGrades: { with: { subject: true } },
					},
				},
				documents: { with: { document: true } },
			},
		});
	}

	async findOrCreateByUserId(userId: string, fullName: string) {
		const existing = await this.findByUserId(userId);
		if (existing) return existing;

		return db.transaction(async (tx) => {
			const [applicant] = await tx
				.insert(applicants)
				.values({ userId, fullName })
				.returning();

			await tx
				.update(users)
				.set({ role: 'applicant' })
				.where(eq(users.id, userId));

			return applicant;
		});
	}

	async search(page: number, search: string) {
		const pageSize = 15;
		const offset = (page - 1) * pageSize;

		const where = search
			? or(
					ilike(applicants.fullName, `%${search}%`),
					ilike(applicants.nationalId, `%${search}%`)
				)
			: undefined;

		const [items, [{ total }]] = await Promise.all([
			db.query.applicants.findMany({
				where,
				limit: pageSize,
				offset,
				orderBy: (a, { desc }) => [desc(a.createdAt)],
			}),
			db
				.select({ total: count() })
				.from(applicants)
				.where(where ?? undefined),
		]);

		return {
			items,
			totalPages: Math.ceil(total / pageSize),
			totalItems: total,
		};
	}

	async addPhone(applicantId: string, phoneNumber: string) {
		const [phone] = await db
			.insert(applicantPhones)
			.values({ applicantId, phoneNumber })
			.returning();
		return phone;
	}

	async removePhone(phoneId: string) {
		await db.delete(applicantPhones).where(eq(applicantPhones.id, phoneId));
	}

	async createGuardian(
		data: typeof guardians.$inferInsert,
		phoneNumber?: string
	) {
		return db.transaction(async (tx) => {
			const [guardian] = await tx.insert(guardians).values(data).returning();
			if (phoneNumber) {
				await tx
					.insert(guardianPhones)
					.values({ guardianId: guardian.id, phoneNumber });
			}
			return guardian;
		});
	}

	async updateGuardian(
		id: string,
		data: Partial<typeof guardians.$inferInsert>
	) {
		const [guardian] = await db
			.update(guardians)
			.set(data)
			.where(eq(guardians.id, id))
			.returning();
		return guardian;
	}

	async deleteGuardian(id: string) {
		await db.delete(guardians).where(eq(guardians.id, id));
	}

	async addGuardianPhone(guardianId: string, phoneNumber: string) {
		const [phone] = await db
			.insert(guardianPhones)
			.values({ guardianId, phoneNumber })
			.returning();
		return phone;
	}

	async removeGuardianPhone(phoneId: string) {
		await db.delete(guardianPhones).where(eq(guardianPhones.id, phoneId));
	}

	async createWithDocumentsAndRecords(
		applicantData: typeof applicants.$inferInsert,
		documentInputs: DocumentInput[],
		academicRecordInputs: AcademicRecordInput[]
	) {
		return db.transaction(async (tx) => {
			const [applicant] = await tx
				.insert(applicants)
				.values(applicantData)
				.returning();

			for (const docInput of documentInputs) {
				const [doc] = await tx
					.insert(documents)
					.values({
						fileName: docInput.fileName,
						fileUrl: docInput.fileUrl,
						type: docInput.type,
					})
					.returning();

				await tx.insert(applicantDocuments).values({
					documentId: doc.id,
					applicantId: applicant.id,
				});
			}

			for (const recordInput of academicRecordInputs) {
				const [record] = await tx
					.insert(academicRecords)
					.values({
						applicantId: applicant.id,
						certificateTypeId: recordInput.certificateTypeId,
						examYear: recordInput.examYear,
						institutionName: recordInput.institutionName,
						qualificationName: recordInput.qualificationName,
						certificateNumber: recordInput.certificateNumber,
						resultClassification: recordInput.resultClassification,
					})
					.returning();

				if (recordInput.subjectGrades && recordInput.subjectGrades.length > 0) {
					await tx.insert(subjectGrades).values(
						recordInput.subjectGrades.map((sg) => ({
							academicRecordId: record.id,
							subjectId: sg.subjectId,
							originalGrade: sg.originalGrade,
							standardGrade: sg.standardGrade,
						}))
					);
				}
			}

			return applicant;
		});
	}
}
