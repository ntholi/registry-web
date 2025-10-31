'use client';

import { useQuery } from '@tanstack/react-query';
import { getAssessmentMarksByModuleId } from '@/server/assessment-marks/actions';
import { getAssessmentByModuleId } from '@/server/assessments/actions';
import { getModuleGradesByModuleId } from '@/server/module-grades/actions';

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
