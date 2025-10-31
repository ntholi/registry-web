import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { documents } from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';

export default class DocumentRepository extends BaseRepository<typeof documents, 'id'> {
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
