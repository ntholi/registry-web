import withPermission from '@/core/platform/withPermission';
import {
	type CGPAFinderFilters,
	exportStudentsByCGPA,
	findStudentsByCGPA,
} from './cgpa-repository';
import {
	exportStudentsByGrade,
	findStudentsByGrade,
	type GradeFinderFilters,
	searchModulesForFilter,
} from './repository';

class GradeFinderService {
	async findStudentsByGrade(filters: GradeFinderFilters, page = 1) {
		return withPermission(
			() => findStudentsByGrade(filters, page),
			['dashboard']
		);
	}

	async searchModulesForFilter(search: string) {
		return withPermission(() => searchModulesForFilter(search), ['dashboard']);
	}

	async findStudentsByCGPA(filters: CGPAFinderFilters, page = 1) {
		return withPermission(
			() => findStudentsByCGPA(filters, page),
			['dashboard']
		);
	}

	async exportStudentsByGrade(filters: GradeFinderFilters) {
		return withPermission(() => exportStudentsByGrade(filters), ['dashboard']);
	}

	async exportStudentsByCGPA(filters: CGPAFinderFilters) {
		return withPermission(() => exportStudentsByCGPA(filters), ['dashboard']);
	}
}

export const gradeFinderService = new GradeFinderService();
