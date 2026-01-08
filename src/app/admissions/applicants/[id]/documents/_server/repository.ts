import type {
	DocumentCategory,
	DocumentVerificationStatus,
} from '@admissions/_database';
import { count, eq } from 'drizzle-orm';
import { applicantDocuments, db } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class ApplicantDocumentRepository extends BaseRepository<
	typeof applicantDocuments,
	'id'
> {
	constructor() {
		super(applicantDocuments, applicantDocuments.id);
	}

	async findByApplicant(applicantId: string, page = 1) {
		const pageSize = 15;
		const offset = (page - 1) * pageSize;

		const [items, [{ total }]] = await Promise.all([
			db.query.applicantDocuments.findMany({
				where: eq(applicantDocuments.applicantId, applicantId),
				limit: pageSize,
				offset,
				orderBy: (d, { desc }) => [desc(d.uploadDate)],
			}),
			db
				.select({ total: count() })
				.from(applicantDocuments)
				.where(eq(applicantDocuments.applicantId, applicantId)),
		]);

		return {
			items,
			totalPages: Math.ceil(total / pageSize),
			totalItems: total,
		};
	}

	async findByCategory(applicantId: string, category: DocumentCategory) {
		return db.query.applicantDocuments.findMany({
			where: (d, { and }) =>
				and(eq(d.applicantId, applicantId), eq(d.category, category)),
			orderBy: (d, { desc }) => [desc(d.uploadDate)],
		});
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

	async removeById(id: string) {
		await db.delete(applicantDocuments).where(eq(applicantDocuments.id, id));
	}
}
