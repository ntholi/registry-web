import withAuth from '@/core/platform/withAuth';
import { type CGPAFinderFilters, findStudentsByCGPA } from './cgpa-repository';
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

	async findStudentsByCGPA(filters: CGPAFinderFilters, page = 1) {
		return withAuth(() => findStudentsByCGPA(filters, page), ['dashboard']);
	}
}

export const gradeFinderService = new GradeFinderService();
