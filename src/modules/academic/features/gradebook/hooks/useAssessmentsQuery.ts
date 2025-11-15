'use client';

import { getAssessmentMarksByModuleId } from '@academic/assessment-marks/server';
import { getAssessmentByModuleId } from '@academic/assessments/server';
import { getModuleGradesByModuleId } from '@academic/module-grades/server';
import { useQuery } from '@tanstack/react-query';

export function useAssessmentsQuery(moduleId: number) {
	return useQuery({
		queryKey: ['assessments', moduleId],
		queryFn: () => getAssessmentByModuleId(moduleId),
	});
}

export function useAssessmentMarksQuery(moduleId: number) {
	return useQuery({
		queryKey: ['assessment-marks', moduleId],
		queryFn: () => getAssessmentMarksByModuleId(moduleId),
	});
}

export function useModuleGradesQuery(moduleId: number) {
	return useQuery({
		queryKey: ['module-grades', moduleId],
		queryFn: () => getModuleGradesByModuleId(moduleId),
	});
}
