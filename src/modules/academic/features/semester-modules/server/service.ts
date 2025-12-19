import type { semesterModules } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import ModuleRepository, { type ModuleGradeInsert } from './repository';

class SemesterModuleService extends BaseService<typeof semesterModules, 'id'> {
	constructor() {
		super(new ModuleRepository(), {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
			createRoles: ['registry'],
			updateRoles: ['registry'],
		});
	}

	override async get(id: number) {
		return withAuth(
			async () => (this.repository as ModuleRepository).findById(id),
			['dashboard']
		);
	}

	async getByCode(code: string) {
		return withAuth(
			async () => (this.repository as ModuleRepository).findByCode(code),
			['dashboard']
		);
	}

	async search(params: QueryOptions<typeof semesterModules>, search: string) {
		return withAuth(
			async () => (this.repository as ModuleRepository).search(params, search),
			['dashboard']
		);
	}

	async findModulesByStructure(structureId: number, search = '') {
		return withAuth(
			async () =>
				(this.repository as ModuleRepository).findModulesByStructure(
					structureId,
					search
				),
			['dashboard']
		);
	}

	async getModulesByStructure(structureId: number) {
		return withAuth(
			async () =>
				(this.repository as ModuleRepository).getModulesByStructure(
					structureId
				),
			['dashboard']
		);
	}

	async getSchools() {
		return withAuth(
			async () => (this.repository as ModuleRepository).getSchools(),
			['dashboard']
		);
	}

	async getProgramsBySchool(schoolId: number) {
		return withAuth(
			async () =>
				(this.repository as ModuleRepository).getProgramsBySchool(schoolId),
			['dashboard']
		);
	}

	async getStructuresByProgram(programId: number) {
		return withAuth(
			async () =>
				(this.repository as ModuleRepository).getStructuresByProgram(programId),
			['dashboard']
		);
	}

	async getStructuresByModule(moduleId: number) {
		return withAuth(
			async () =>
				(this.repository as ModuleRepository).getStructuresByModule(moduleId),
			['dashboard']
		);
	}

	async addPrerequisite(moduleId: number, prerequisiteId: number) {
		return withAuth(
			async () =>
				(this.repository as ModuleRepository).addPrerequisite(
					moduleId,
					prerequisiteId
				),
			['dashboard']
		);
	}

	async clearPrerequisites(moduleId: number) {
		return withAuth(
			async () =>
				(this.repository as ModuleRepository).clearPrerequisites(moduleId),
			['dashboard']
		);
	}

	async getPrerequisites(moduleId: number) {
		return withAuth(
			async () =>
				(this.repository as ModuleRepository).getPrerequisites(moduleId),
			['dashboard']
		);
	}

	async getModulesForStructure(structureId: number) {
		return withAuth(
			async () =>
				(this.repository as ModuleRepository).getModulesForStructure(
					structureId
				),
			['dashboard', 'student']
		);
	}

	async searchModulesWithDetails(search = '') {
		return withAuth(
			async () =>
				(this.repository as ModuleRepository).searchModulesWithDetails(search),
			['dashboard']
		);
	}
	async getStudentCountForModule(id: number) {
		return withAuth(
			async () =>
				(
					this.repository as ModuleRepository
				).getStudentCountForPreviousSemester(id),
			['dashboard']
		);
	}

	async findGradeByModuleAndStudent(moduleId: number, stdNo: number) {
		return withAuth(
			async () =>
				(this.repository as ModuleRepository).findGradeByModuleAndStudent(
					moduleId,
					stdNo
				),
			['academic']
		);
	}

	async getGradesByModuleId(moduleId: number) {
		return withAuth(
			async () =>
				(this.repository as ModuleRepository).findGradesByModuleId(moduleId),
			['academic']
		);
	}

	async upsertModuleGrade(data: ModuleGradeInsert) {
		return withAuth(
			async () => (this.repository as ModuleRepository).upsertModuleGrade(data),
			['academic']
		);
	}
}

export const semesterModulesService = serviceWrapper(
	SemesterModuleService,
	'SemesterModuleService'
);
