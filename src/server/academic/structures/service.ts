import type { QueryOptions } from '@server/base/BaseRepository';
import type { structures } from '@/db/schema';
import { serviceWrapper } from '@/server/base/serviceWrapper';
import withAuth from '@/server/base/withAuth';
import StructureRepository from './repository';

type Structure = typeof structures.$inferInsert;

class StructureService {
	constructor(private readonly repository = new StructureRepository()) {}

	async first() {
		return withAuth(async () => this.repository.findFirst(), []);
	}

	async get(id: number) {
		return withAuth(async () => this.repository.findById(id), ['dashboard']);
	}

	async getByProgramId(programId: number) {
		return withAuth(
			async () => this.repository.findByProgramId(programId),
			['dashboard']
		);
	}

	async findAll(params: QueryOptions<typeof structures>) {
		return withAuth(async () => this.repository.query(params), ['dashboard']);
	}

	async create(data: Structure) {
		return withAuth(async () => this.repository.create(data), []);
	}

	async update(id: number, data: Structure) {
		return withAuth(async () => this.repository.update(id, data), []);
	}

	async delete(id: number) {
		return withAuth(async () => this.repository.delete(id), []);
	}

	async deleteSemesterModule(id: number) {
		withAuth(async () => this.repository.deleteSemesterModule(id), []);
	}

	async count() {
		return withAuth(async () => this.repository.count(), []);
	}

	async getStructureModules(structureId: number) {
		return withAuth(
			async () => this.repository.getStructureModules(structureId),
			['dashboard']
		);
	}
}

export const structuresService = serviceWrapper(
	StructureService,
	'StructuresService'
);
