import { eq } from 'drizzle-orm';
import { db } from '@/core/db';
import { terms } from '@/core/db/schema';
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
