import { eq } from 'drizzle-orm';
import { db } from '@/core/database';
import { terms } from '@/core/database/schema';
import BaseRepository from '@/server/base/BaseRepository';

export default class TermRepository extends BaseRepository<typeof terms, 'id'> {
	constructor() {
		super(terms, terms.id);
	}

	async getActive() {
		return db.query.terms.findFirst({ where: eq(terms.isActive, true) });
	}
}

export const termsRepository = new TermRepository();
