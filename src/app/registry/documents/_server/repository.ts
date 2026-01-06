import { desc, eq } from 'drizzle-orm';
import { db, documents } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class DocumentRepository extends BaseRepository<
	typeof documents,
	'id'
> {
	constructor() {
		super(documents, documents.id);
	}

	async findByStudent(stdNo: number) {
		return db.query.documents.findMany({
			where: eq(documents.stdNo, stdNo),
			orderBy: [desc(documents.createdAt)],
		});
	}
}

export const documentsRepository = new DocumentRepository();
