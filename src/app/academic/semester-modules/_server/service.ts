import type { Grade } from '@registry/_database';
import { DASHBOARD_ROLES } from '@/core/auth/permissions';
import {
	hasSessionRole,
	isStudentSession,
} from '@/core/auth/sessionPermissions';
import type { semesterModules } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { withPermission } from '@/core/platform/withPermission';
import ModuleRepository, { type ModuleGradeInsert } from './repository';

class SemesterModuleService extends BaseService<typeof semesterModules, 'id'> {
	constructor() {
		super(new ModuleRepository(), {
			byIdAuth: 'dashboard',
			findAllAuth: 'dashboard',
			createAuth: { 'semester-modules': ['create'] },
			updateAuth: { 'semester-modules': ['update'] },
			activityTypes: {
				create: 'semester_module_created',
				update: 'semester_module_updated',
				delete: 'semester_module_deleted',
			},
		});
	}

	override async get(id: number) {
		return withPermission(
			async () => (this.repository as ModuleRepository).findById(id),
			'dashboard'
		);
	}

	async getByCode(code: string) {
		return withPermission(
			async () => (this.repository as ModuleRepository).findByCode(code),
			'dashboard'
		);
	}

	async search(params: QueryOptions<typeof semesterModules>, search: string) {
		return withPermission(
			async () => (this.repository as ModuleRepository).search(params, search),
			'dashboard'
		);
	}

	async findModulesByStructure(structureId: number, search = '') {
		return withPermission(
			async () =>
				(this.repository as ModuleRepository).findModulesByStructure(
					structureId,
					search
				),
			'dashboard'
		);
	}

	async getModulesByStructure(structureId: number) {
		return withPermission(
			async () =>
				(this.repository as ModuleRepository).getModulesByStructure(
					structureId
				),
			'dashboard'
		);
	}

	async getStructuresByModule(moduleId: number) {
		return withPermission(
			async () =>
				(this.repository as ModuleRepository).getStructuresByModule(moduleId),
			'dashboard'
		);
	}

	async addPrerequisite(moduleId: number, prerequisiteId: number) {
		return withPermission(
			async () =>
				(this.repository as ModuleRepository).addPrerequisite(
					moduleId,
					prerequisiteId
				),
			{ 'semester-modules': ['update'] }
		);
	}

	async clearPrerequisites(moduleId: number) {
		return withPermission(
			async () =>
				(this.repository as ModuleRepository).clearPrerequisites(moduleId),
			{ 'semester-modules': ['update'] }
		);
	}

	async getPrerequisites(moduleId: number) {
		return withPermission(
			async () =>
				(this.repository as ModuleRepository).getPrerequisites(moduleId),
			'dashboard'
		);
	}

	async getModulesForStructure(structureId: number) {
		return withPermission(
			async () =>
				(this.repository as ModuleRepository).getModulesForStructure(
					structureId
				),
			async (session) =>
				isStudentSession(session) || hasSessionRole(session, DASHBOARD_ROLES)
		);
	}

	async searchModulesWithDetails(search = '') {
		return withPermission(
			async () =>
				(this.repository as ModuleRepository).searchModulesWithDetails(search),
			'dashboard'
		);
	}
	async getStudentCountForModule(id: number) {
		return withPermission(
			async () =>
				(
					this.repository as ModuleRepository
				).getStudentCountForPreviousSemester(id),
			'dashboard'
		);
	}

	async findGradeByModuleAndStudent(moduleId: number, stdNo: number) {
		return withPermission(
			async () =>
				(this.repository as ModuleRepository).findGradeByModuleAndStudent(
					moduleId,
					stdNo
				),
			{ gradebook: ['read'] }
		);
	}

	async getGradesByModuleId(moduleId: number) {
		return withPermission(
			async () =>
				(this.repository as ModuleRepository).findGradesByModuleId(moduleId),
			{ gradebook: ['read'] }
		);
	}

	async upsertModuleGrade(data: ModuleGradeInsert) {
		return withPermission(
			async () => (this.repository as ModuleRepository).upsertModuleGrade(data),
			{ gradebook: ['update'] }
		);
	}

	async updateGradeByStudentModuleId(
		studentModuleId: number,
		grade: Grade,
		weightedTotal: number
	) {
		return withPermission(
			async () =>
				(this.repository as ModuleRepository).updateGradeByStudentModuleId(
					studentModuleId,
					grade,
					weightedTotal
				),
			{ gradebook: ['update'] }
		);
	}

	async deleteSemesterModule(id: number) {
		return withPermission(
			async () =>
				(this.repository as ModuleRepository).deleteSemesterModule(id),
			{ 'semester-modules': ['update'] }
		);
	}
}

export const semesterModulesService = serviceWrapper(
	SemesterModuleService,
	'SemesterModuleService'
);
