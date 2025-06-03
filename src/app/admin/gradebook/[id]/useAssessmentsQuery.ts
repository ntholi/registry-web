'use client';

import { getAssessmentByModuleId } from '@/server/assessments/actions';
import { getAssessmentMarksByModuleId } from '@/server/assessment-marks/actions';
import { useQuery } from '@tanstack/react-query';

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
