'use server';

import { createAction } from '@/shared/lib/utils/actionResult';
import type { CGPAFinderFilters } from './cgpa-repository';
import type { GradeFinderFilters } from './repository';
import { gradeFinderService } from './service';

export const findStudentsByGrade = createAction(
	async (filters: GradeFinderFilters, page: number = 1) => {
		return gradeFinderService.findStudentsByGrade(filters, page);
	}
);

export const searchModulesForGradeFinder = createAction(
	async (search: string) => {
		return gradeFinderService.searchModulesForFilter(search);
	}
);

export const findStudentsByCGPA = createAction(
	async (filters: CGPAFinderFilters, page: number = 1) => {
		return gradeFinderService.findStudentsByCGPA(filters, page);
	}
);

export const exportGradeFinderResults = createAction(
	async (filters: GradeFinderFilters) => {
		return gradeFinderService.exportStudentsByGrade(filters);
	}
);

export const exportCGPAFinderResults = createAction(
	async (filters: CGPAFinderFilters) => {
		return gradeFinderService.exportStudentsByCGPA(filters);
	}
);
