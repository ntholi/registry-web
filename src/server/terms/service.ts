import { terms } from '@/db/schema';
import TermRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { serviceWrapper } from '@/server/base/serviceWrapper';

type Term = typeof terms.$inferInsert;

class TermService {
  constructor(private readonly repository = new TermRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), []);
  }

  async getActive() {
    return withAuth(async () => this.repository.getActive(), ['all']);
  }

  async findAll(params: QueryOptions<typeof terms>) {
    return withAuth(async () => this.repository.query(params), ['dashboard']);
  }

  async create(data: Term) {
    return withAuth(async () => {
      if (data.isActive) {
        await db
          .update(terms)
          .set({ isActive: false })
          .where(eq(terms.isActive, true));
      }
      return this.repository.create(data);
    }, []);
  }

  async update(id: number, data: Term) {
    return withAuth(async () => {
      if (data.isActive) {
        await db
          .update(terms)
          .set({ isActive: false })
          .where(eq(terms.isActive, true));
      }
      return this.repository.update(id, data);
    }, []);
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }
}

export const termsService = serviceWrapper(TermService, 'TermsService');
