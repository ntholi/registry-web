import withAuth from '@/core/platform/withAuth';
import ModuleGradeRepository, { type ModuleGradeInsert } from './repository';

class ModuleGradeService {
	private repository = new ModuleGradeRepository();

	async findByModuleAndStudent(moduleId: number, stdNo: number) {
		return withAuth(
			async () => this.repository.findByModuleAndStudent(moduleId, stdNo),
			['academic']
		);
	}

	async getByModuleId(moduleId: number) {
		return withAuth(
			async () => this.repository.findByModuleId(moduleId),
			['academic']
		);
	}

	async upsertModuleGrade(data: ModuleGradeInsert) {
		return withAuth(
			async () => this.repository.upsertModuleGrade(data),
			['academic']
		);
	}
}

export const moduleGradesService = new ModuleGradeService();
