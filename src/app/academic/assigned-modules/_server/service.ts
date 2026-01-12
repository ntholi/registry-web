import { getActiveTerm } from '@/app/registry/terms';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import AssignedModuleRepository from './repository';

class AssignedModuleService {
	constructor(private readonly repository = new AssignedModuleRepository()) {}

	async delete(id: number) {
		return withAuth(async () => this.repository.delete(id), ['academic']);
	}

	async assignModulesToLecturer(userId: string, semesterModuleIds: number[]) {
		return withAuth(async () => {
			await this.repository.removeModuleAssignments(userId, semesterModuleIds);
			const term = await getActiveTerm();
			const assignments = semesterModuleIds.map((semesterModuleId) => ({
				userId,
				semesterModuleId,
				termId: term.id,
			}));

			return this.repository.createMany(assignments);
		}, ['academic']);
	}

	async getByUserAndModule(userId: string, moduleId: number) {
		return withAuth(
			async () => this.repository.findByUserAndModule(userId, moduleId),
			['academic']
		);
	}
	async getLecturersByModule(moduleId: number) {
		return withAuth(
			async () => this.repository.findByModule(moduleId),
			['academic']
		);
	}

	async getByUser(userId: string) {
		return withAuth(
			async () => this.repository.findByUser(userId),
			['academic']
		);
	}

	async getByUserGroupedByModule(userId: string) {
		const data = await this.getByUser(userId);
		type ResultType = (typeof data)[0];

		const moduleMap = new Map<number, ResultType>();
		data.forEach((item) => {
			const mod = item.semesterModule.module;
			if (mod) {
				moduleMap.set(mod.id, item);
			}
		});
		return Array.from(moduleMap.values());
	}

	async checkAssignment(userId: string, semesterModuleId: number) {
		return withAuth(
			async () => this.repository.findByUserAndModule(userId, semesterModuleId),
			['academic']
		);
	}

	async getByLmsCourseId(lmsCourseId: string) {
		return withAuth(
			async () => this.repository.findByLmsCourseId(lmsCourseId),
			['dashboard']
		);
	}

	async linkCourseToAssignment(
		userId: string,
		semesterModuleId: number,
		lmsCourseId: string
	) {
		return withAuth(
			async () =>
				this.repository.linkCourseToAssignment(
					userId,
					semesterModuleId,
					lmsCourseId
				),
			['dashboard']
		);
	}
}

export const assignedModulesService = serviceWrapper(
	AssignedModuleService,
	'AssignedModuleService'
);
