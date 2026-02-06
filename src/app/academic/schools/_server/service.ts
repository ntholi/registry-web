import type { schools } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import SchoolRepository from './repository';

class SchoolService {
	constructor(private readonly repository = new SchoolRepository()) {}

	async findAll(params: QueryOptions<typeof schools> = {}) {
		return withAuth(async () => this.repository.query(params), ['dashboard']);
	}

	async get(id: number) {
		return withAuth(async () => this.repository.findById(id), ['dashboard']);
	}

	async getAll() {
		return withAuth(async () => this.repository.findAll(), ['dashboard']);
	}

	async getActiveSchools() {
		return withAuth(
			async () => this.repository.getActiveSchools(),
			['dashboard']
		);
	}

	async getProgramsBySchoolId(schoolId?: number) {
		return withAuth(
			async () => this.repository.getProgramsBySchoolId(schoolId),
			['dashboard']
		);
	}

	async getAllPrograms() {
		return withAuth(
			async () => this.repository.getAllPrograms(),
			['dashboard']
		);
	}

	async getAllProgramsWithLevel() {
		return withAuth(
			async () => this.repository.getAllProgramsWithLevel(),
			['dashboard']
		);
	}

	async getProgramsBySchoolIds(schoolIds?: number[]) {
		return withAuth(
			async () => this.repository.getProgramsBySchoolIds(schoolIds),
			['dashboard']
		);
	}
}

export const schoolsService = serviceWrapper(SchoolService, 'SchoolsService');
