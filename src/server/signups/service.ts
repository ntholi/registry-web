import type { signups } from '@/db/schema';
import { serviceWrapper } from '@/server/base/serviceWrapper';
import withAuth from '@/server/base/withAuth';
import type { QueryOptions } from '../base/BaseRepository';
import SignupRepository from './repository';

type Signup = typeof signups.$inferInsert;

class SignupService {
	constructor(private readonly repository = new SignupRepository()) {}

	async first() {
		return withAuth(async () => this.repository.findFirst(), []);
	}

	async get(userId: string) {
		return withAuth(async () => this.repository.findById(userId), ['auth']);
	}

	async findAll(params: QueryOptions<typeof signups>) {
		return withAuth(async () => this.repository.query(params), []);
	}

	async create(data: Signup) {
		return withAuth(async () => this.repository.create(data), ['auth']);
	}

	async update(id: string, data: Signup) {
		return withAuth(async () => this.repository.update(id, data), ['auth']);
	}

	async delete(id: string) {
		return withAuth(async () => this.repository.delete(id), []);
	}

	async count() {
		return withAuth(async () => this.repository.count(), []);
	}
}

export const signupsService = serviceWrapper(SignupService, 'SignupsService');
