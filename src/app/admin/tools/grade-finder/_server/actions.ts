'use server';

import type { CGPAFinderFilters } from './cgpa-repository';
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

export async function findStudentsByCGPA(filters: CGPAFinderFilters, page = 1) {
	return gradeFinderService.findStudentsByCGPA(filters, page);
}

export async function exportGradeFinderResults(filters: GradeFinderFilters) {
	return gradeFinderService.exportStudentsByGrade(filters);
}

export async function exportCGPAFinderResults(filters: CGPAFinderFilters) {
	return gradeFinderService.exportStudentsByCGPA(filters);
}
