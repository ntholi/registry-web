import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db, documents, studentDocuments } from '@/core/database';
import BaseRepository, {
	type AuditOptions,
} from '@/core/platform/BaseRepository';
import type { DocumentType } from '../_schema/documents';

export default class DocumentRepository extends BaseRepository<
	typeof studentDocuments,
	'id'
> {
	protected readonly db = db;

	constructor() {
		super(studentDocuments, studentDocuments.id);
	}

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

	async createWithDocument(
		data: {
			fileName: string;
			fileUrl: string;
			type: DocumentType;
			stdNo: number;
		},
		audit?: AuditOptions
	) {
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

			if (audit) {
				await this.writeAuditLog(tx, 'INSERT', sdId, null, studentDoc, audit);
			}

			return studentDoc;
		});
	}

	async removeById(id: string, audit?: AuditOptions) {
		return this.db.transaction(async (tx) => {
			const studentDoc = await tx.query.studentDocuments.findFirst({
				where: eq(studentDocuments.id, id),
			});

			if (studentDoc) {
				await tx.delete(studentDocuments).where(eq(studentDocuments.id, id));
				await tx
					.delete(documents)
					.where(eq(documents.id, studentDoc.documentId));

				if (audit) {
					await this.writeAuditLog(tx, 'DELETE', id, studentDoc, null, audit);
				}
			}

			return studentDoc;
		});
	}
}

export const documentsRepository = new DocumentRepository();
