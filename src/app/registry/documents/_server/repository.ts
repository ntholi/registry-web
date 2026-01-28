import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import {
	db,
	documentStamps,
	documents,
	studentDocuments,
} from '@/core/database';
import type { NewDocumentStamp } from '../_schema/documentStamps';
import type { DocumentType } from '../_schema/documents';

export default class DocumentRepository {
	protected readonly db = db;

	async findByStudent(stdNo: number) {
		return this.db.query.studentDocuments.findMany({
			where: eq(studentDocuments.stdNo, stdNo),
			with: { document: true },
			orderBy: (sd, { desc }) => [desc(sd.id)],
		});
	}

	async findByType(stdNo: number, type: DocumentType) {
		const result = await this.db.query.studentDocuments.findMany({
			where: eq(studentDocuments.stdNo, stdNo),
			with: { document: true },
		});
		return result.find((sd) => sd.document.type === type);
	}

	async createWithDocument(data: {
		fileName: string;
		fileUrl: string;
		type: DocumentType;
		stdNo: number;
	}) {
		return this.db.transaction(async (tx) => {
			const docId = nanoid();
			await tx.insert(documents).values({
				id: docId,
				fileName: data.fileName,
				fileUrl: data.fileUrl,
				type: data.type,
			});

			const sdId = nanoid();
			const [studentDoc] = await tx
				.insert(studentDocuments)
				.values({
					id: sdId,
					documentId: docId,
					stdNo: data.stdNo,
				})
				.returning();

			return studentDoc;
		});
	}

	async removeById(id: string) {
		return this.db.transaction(async (tx) => {
			const studentDoc = await tx.query.studentDocuments.findFirst({
				where: eq(studentDocuments.id, id),
			});

			if (studentDoc) {
				await tx.delete(studentDocuments).where(eq(studentDocuments.id, id));
				await tx
					.delete(documents)
					.where(eq(documents.id, studentDoc.documentId));
			}

			return studentDoc;
		});
	}

	async createStamps(
		documentId: string,
		stamps: Omit<NewDocumentStamp, 'id' | 'documentId' | 'createdAt'>[]
	) {
		if (stamps.length === 0) return [];

		const values = stamps.map((stamp) => ({
			id: nanoid(),
			documentId,
			date: stamp.date,
			name: stamp.name,
			title: stamp.title,
		}));

		return this.db.insert(documentStamps).values(values).returning();
	}

	async getStampsByDocumentId(documentId: string) {
		return this.db.query.documentStamps.findMany({
			where: eq(documentStamps.documentId, documentId),
			orderBy: (stamps, { desc }) => [desc(stamps.date)],
		});
	}

	async deleteStampsByDocumentId(documentId: string) {
		return this.db
			.delete(documentStamps)
			.where(eq(documentStamps.documentId, documentId));
	}
}

export const documentsRepository = new DocumentRepository();
