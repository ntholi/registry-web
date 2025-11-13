'use client';

import { useQuery } from '@tanstack/react-query';
import { getAssessmentMarksByModuleId } from '@/modules/academic/features/assessment-marks/server/actions';
import { getAssessmentByModuleId } from '@/modules/academic/features/assessments/server/actions';
import { getModuleGradesByModuleId } from '@/modules/academic/features/module-grades/server/actions';

export function useAssessmentsQuery(moduleId: number) {
	return useQuery({
		queryKey: ['assessments', moduleId],
		queryFn: () => getAssessmentByModuleId(moduleId),
	});
}

export function useAssessmentMarksQuery(moduleId: number) {
	return useQuery({
		queryKey: ['assessmentMarks', moduleId],
		queryFn: () => getAssessmentMarksByModuleId(moduleId),
	});
}

export function useModuleGradesQuery(moduleId: number) {
	return useQuery({
		queryKey: ['moduleGrades', moduleId],
		queryFn: () => getModuleGradesByModuleId(moduleId),
	});
}
