import type { modules } from '@/db/schema';
import withAuth from '@/server/base/withAuth';
import type { QueryOptions } from '../base/BaseRepository';
import ModuleRepository from './repository';

type Module = typeof modules.$inferInsert;

class ModuleService {
	constructor(private readonly repository = new ModuleRepository()) {}

	async first() {
		return withAuth(async () => this.repository.findFirst(), []);
	}

	async get(id: number) {
		return withAuth(async () => this.repository.findById(id), ['dashboard']);
	}

	async getAll(params: QueryOptions<typeof modules>) {
		return withAuth(async () => this.repository.query(params), ['dashboard']);
	}

	async create(data: Module) {
		return withAuth(async () => this.repository.create(data), []);
	}

	async update(id: number, data: Module) {
		return withAuth(async () => this.repository.update(id, data), []);
	}

	async delete(id: number) {
		return withAuth(async () => this.repository.delete(id), []);
	}

	async count() {
		return withAuth(async () => this.repository.count(), []);
	}
}

export const modulesService = new ModuleService();
