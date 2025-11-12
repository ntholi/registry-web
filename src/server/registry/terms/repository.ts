import { eq } from 'drizzle-orm';
import BaseRepository from '@/server/base/BaseRepository';
import { db } from '@/shared/db';
import { terms } from '@/shared/db/schema';

export default class TermRepository extends BaseRepository<typeof terms, 'id'> {
	constructor() {
		super(terms, terms.id);
	}

	async getActive() {
		return db.query.terms.findFirst({ where: eq(terms.isActive, true) });
	}
}

export const termsRepository = new TermRepository();
