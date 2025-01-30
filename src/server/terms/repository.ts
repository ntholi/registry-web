import BaseRepository from '@/server/base/BaseRepository';
import { terms } from '@/db/schema';
import { db } from '@/db';
import { eq } from 'drizzle-orm';

export default class TermRepository extends BaseRepository<typeof terms, 'id'> {
  constructor() {
    super(terms, 'id');
  }

  async getActive() {
    return db.query.terms.findFirst({ where: eq(terms.isActive, true) });
  }
}

export const termsRepository = new TermRepository();
