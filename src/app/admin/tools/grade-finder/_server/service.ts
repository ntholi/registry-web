import withAuth from '@/core/platform/withAuth';
import {
	findStudentsByGrade,
	type GradeFinderFilters,
	searchModulesForFilter,
} from './repository';

class GradeFinderService {
	async findStudentsByGrade(filters: GradeFinderFilters, page = 1) {
		return withAuth(() => findStudentsByGrade(filters, page), ['dashboard']);
	}

	async searchModulesForFilter(search: string) {
		return withAuth(() => searchModulesForFilter(search), ['dashboard']);
	}
}

export const gradeFinderService = new GradeFinderService();
