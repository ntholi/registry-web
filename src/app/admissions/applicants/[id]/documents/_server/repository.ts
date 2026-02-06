import { count, eq } from 'drizzle-orm';
import type { DocumentType, DocumentVerificationStatus } from '@/core/database';
import { applicantDocuments, db, documents } from '@/core/database';
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
				with: { document: true },
				limit: pageSize,
				offset,
				orderBy: (d, { desc }) => [desc(d.id)],
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

	async findByType(applicantId: string, type: DocumentType) {
		return db.query.applicantDocuments
			.findMany({
				where: eq(applicantDocuments.applicantId, applicantId),
				with: {
					document: {
						columns: {
							id: true,
							fileName: true,
							fileUrl: true,
							type: true,
							createdAt: true,
						},
					},
				},
			})
			.then((results) => results.filter((r) => r.document.type === type));
	}

	async createWithDocument(
		documentData: typeof documents.$inferInsert,
		applicantId: string
	) {
		return db.transaction(async (tx) => {
			const [doc] = await tx.insert(documents).values(documentData).returning();
			const [appDoc] = await tx
				.insert(applicantDocuments)
				.values({
					documentId: doc.id,
					applicantId,
				})
				.returning();

			return { ...appDoc, document: doc };
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
		const appDoc = await db.query.applicantDocuments.findFirst({
			where: eq(applicantDocuments.id, id),
		});
		if (appDoc) {
			await db.delete(applicantDocuments).where(eq(applicantDocuments.id, id));
			await db.delete(documents).where(eq(documents.id, appDoc.documentId));
		}
	}
}
