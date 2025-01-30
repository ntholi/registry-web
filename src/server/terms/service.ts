import { terms } from '@/db/schema';
import TermRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { FindAllParams } from '../base/BaseRepository';
import { db } from '@/db';
import { eq } from 'drizzle-orm';

type Term = typeof terms.$inferInsert;

class TermService {
  constructor(private readonly repository = new TermRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), []);
  }

  async findAll(params: FindAllParams<typeof terms>) {
    return withAuth(async () => this.repository.findAll(params), []);
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

export const termsService = new TermService();
