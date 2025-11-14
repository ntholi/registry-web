import { getCurrentTerm } from '@registry/terms';
import type { semesterModules } from '@/core/database/schema';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import ModuleRepository from './repository';

type Module = typeof semesterModules.$inferInsert;

class SemesterModuleService {
	constructor(private readonly repository = new ModuleRepository()) {}

	async first() {
		return withAuth(async () => this.repository.findFirst(), []);
	}

	async get(id: number) {
		return withAuth(async () => this.repository.findById(id), ['dashboard']);
	}

	async getByCode(code: string) {
		return withAuth(
			async () => this.repository.findByCode(code),
			['dashboard']
		);
	}

	async findAll(params: QueryOptions<typeof semesterModules>, search: string) {
		return withAuth(
			async () => this.repository.search(params, search),
			['dashboard']
		);
	}

	async findModulesByStructure(structureId: number, search = '') {
		return withAuth(
			async () => this.repository.findModulesByStructure(structureId, search),
			['dashboard']
		);
	}

	async create(data: Module) {
		return withAuth(async () => this.repository.create(data), ['registry']);
	}

	async update(id: number, data: Module) {
		return withAuth(async () => this.repository.update(id, data), ['registry']);
	}

	async delete(id: number) {
		return withAuth(async () => this.repository.delete(id), []);
	}

	async count() {
		return withAuth(async () => this.repository.count(), []);
	}

	async getModulesByStructure(structureId: number) {
		return withAuth(
			async () => this.repository.getModulesByStructure(structureId),
			['dashboard']
		);
	}

	async getSchools() {
		return withAuth(async () => this.repository.getSchools(), ['dashboard']);
	}

	async getProgramsBySchool(schoolId: number) {
		return withAuth(
			async () => this.repository.getProgramsBySchool(schoolId),
			['dashboard']
		);
	}

	async getStructuresByProgram(programId: number) {
		return withAuth(
			async () => this.repository.getStructuresByProgram(programId),
			['dashboard']
		);
	}

	async getStructuresByModule(moduleId: number) {
		return withAuth(
			async () => this.repository.getStructuresByModule(moduleId),
			['dashboard']
		);
	}

	async addPrerequisite(moduleId: number, prerequisiteId: number) {
		return withAuth(
			async () => this.repository.addPrerequisite(moduleId, prerequisiteId),
			['dashboard']
		);
	}

	async clearPrerequisites(moduleId: number) {
		return withAuth(
			async () => this.repository.clearPrerequisites(moduleId),
			['dashboard']
		);
	}

	async getPrerequisites(moduleId: number) {
		return withAuth(
			async () => this.repository.getPrerequisites(moduleId),
			['dashboard']
		);
	}

	async getModulesForStructure(structureId: number) {
		return withAuth(
			async () => this.repository.getModulesForStructure(structureId),
			['dashboard', 'student']
		);
	}

	async searchModulesWithDetails(search = '') {
		const term = await getCurrentTerm();
		return withAuth(
			async () => this.repository.searchModulesWithDetails(search, term),
			['dashboard']
		);
	}
}

export const semesterModulesService = serviceWrapper(
	SemesterModuleService,
	'SemesterModuleService'
);
