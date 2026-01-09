'use server';

import type { GradeFinderFilters } from './repository';
import { gradeFinderService } from './service';

export async function findStudentsByGrade(
	filters: GradeFinderFilters,
	page = 1
) {
	return gradeFinderService.findStudentsByGrade(filters, page);
}

export async function searchModulesForGradeFinder(search: string) {
	return gradeFinderService.searchModulesForFilter(search);
}
