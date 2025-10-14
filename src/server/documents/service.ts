import { documents } from '@/db/schema';
import DocumentRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';
import { serviceWrapper } from '../base/serviceWrapper';

type Document = typeof documents.$inferInsert;

class DocumentService {
  constructor(private readonly repository = new DocumentRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: string) {
    return withAuth(async () => this.repository.findById(id), []);
  }

  async getAll(params: QueryOptions<typeof documents>) {
    return withAuth(async () => this.repository.query(params), []);
  }

  async create(data: Document) {
    return withAuth(async () => this.repository.create(data), []);
  }

  async update(id: string, data: Partial<Document>) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: string) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }
}

export const documentsService = serviceWrapper(DocumentService, 'Document');
