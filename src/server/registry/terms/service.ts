import type { QueryOptions } from '@server/base/BaseRepository';
import { eq } from 'drizzle-orm';
import { serviceWrapper } from '@/server/base/serviceWrapper';
import withAuth from '@/server/base/withAuth';
import { db } from '@/shared/db';
import { terms } from '@/shared/db/schema';
import TermRepository from './repository';

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

	async getAll() {
		return withAuth(async () => this.repository.findAll(), ['dashboard']);
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

	async update(id: number, data: Partial<Term>) {
		return withAuth(async () => {
			if (data.isActive) {
				await db
					.update(terms)
					.set({ isActive: false })
					.where(eq(terms.isActive, true));
			}
			await this.repository.update(id, data);
			return this.repository.findById(id);
		}, []);
	}

	async delete(id: number) {
		return withAuth(async () => {
			const term = await this.repository.findById(id);
			await this.repository.delete(id);
			return term;
		}, []);
	}

	async count() {
		return withAuth(async () => this.repository.count(), []);
	}
}

export const termsService = serviceWrapper(TermService, 'TermsService');
