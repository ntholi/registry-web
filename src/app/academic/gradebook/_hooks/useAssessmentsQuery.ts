'use client';

import { getAssessmentMarksByModuleId } from '@academic/assessment-marks';
import { getAssessmentByModuleId } from '@academic/assessments';
import { getModuleGradesByModuleId } from '@academic/semester-modules';
import { useQuery } from '@tanstack/react-query';
import { unwrap } from '@/shared/lib/utils/actionResult';

export function useAssessmentsQuery(moduleId: number) {
	return useQuery({
		queryKey: ['assessments', moduleId],
		queryFn: () => getAssessmentByModuleId(moduleId),
		select: unwrap,
	});
}

export function useAssessmentMarksQuery(moduleId: number) {
	return useQuery({
		queryKey: ['assessment-marks', moduleId],
		queryFn: () => getAssessmentMarksByModuleId(moduleId),
		select: unwrap,
	});
}

export function useModuleGradesQuery(moduleId: number) {
	return useQuery({
		queryKey: ['module-grades', moduleId],
		queryFn: () => getModuleGradesByModuleId(moduleId),
		select: unwrap,
	});
}
