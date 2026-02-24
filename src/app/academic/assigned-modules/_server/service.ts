import { getActiveTerm } from '@/app/registry/terms';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import AssignedModuleRepository from './repository';

class AssignedModuleService {
	constructor(private readonly repository = new AssignedModuleRepository()) {}

	async delete(id: number) {
		return withAuth(
			async (session) =>
				this.repository.delete(id, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'module_unassigned',
				}),
			['academic', 'leap']
		);
	}

	async assignModulesToLecturer(userId: string, semesterModuleIds: number[]) {
		return withAuth(
			async (session) => {
				await this.repository.removeModuleAssignments(
					userId,
					semesterModuleIds
				);
				const term = await getActiveTerm();
				const assignments = semesterModuleIds.map((semesterModuleId) => ({
					userId,
					semesterModuleId,
					termId: term.id,
				}));

				return this.repository.createMany(assignments, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'module_assigned',
				});
			},
			['academic', 'leap']
		);
	}

	async getByUserAndModule(userId: string, moduleId: number) {
		return withAuth(
			async () => this.repository.findByUserAndModule(userId, moduleId),
			['academic', 'leap']
		);
	}
	async getLecturersByModule(moduleId: number) {
		return withAuth(
			async () => this.repository.findByModule(moduleId),
			['academic', 'leap']
		);
	}

	async getByUser(userId: string, termId?: number) {
		return withAuth(
			async () => this.repository.findByUser(userId, termId),
			['academic', 'leap']
		);
	}

	async getByUserGroupedByModule(userId: string, termId?: number) {
		const data = await this.getByUser(userId, termId);
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
			['academic', 'leap']
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
