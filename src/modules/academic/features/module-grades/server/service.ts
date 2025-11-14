import type { moduleGrades } from '@/core/database/schema';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import ModuleGradeRepository from './repository';

type ModuleGrade = typeof moduleGrades.$inferInsert;

class ModuleGradeService extends BaseService<typeof moduleGrades, 'id'> {
	constructor() {
		super(new ModuleGradeRepository());
	}

	async findByModuleAndStudent(moduleId: number, stdNo: number) {
		return withAuth(
			async () =>
				(this.repository as ModuleGradeRepository).findByModuleAndStudent(
					moduleId,
					stdNo
				),
			['academic']
		);
	}

	async getByModuleId(moduleId: number) {
		return withAuth(
			async () =>
				(this.repository as ModuleGradeRepository).findByModuleId(moduleId),
			['academic']
		);
	}

	async upsertModuleGrade(data: ModuleGrade) {
		return withAuth(
			async () =>
				(this.repository as ModuleGradeRepository).upsertModuleGrade(data),
			['academic']
		);
	}
}

export const moduleGradesService = serviceWrapper(
	ModuleGradeService,
	'ModuleGradeService'
);
