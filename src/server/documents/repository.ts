import BaseRepository from '@/server/base/BaseRepository';
import { documents } from '@/db/schema';
import { db } from '@/db';
import { eq, desc } from 'drizzle-orm';

export default class DocumentRepository extends BaseRepository<
  typeof documents,
  'id'
> {
  constructor() {
    super(documents, 'id');
  }

  async findByStudent(stdNo: number) {
    return db.query.documents.findMany({
      where: eq(documents.stdNo, stdNo),
      orderBy: [desc(documents.createdAt)],
    });
  }
}

export const documentsRepository = new DocumentRepository();
