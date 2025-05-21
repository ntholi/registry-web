'use client';

import { getAssessmentBySemesterModuleId } from '@/server/assessments/actions';
import { getAssessmentMarksByModuleId } from '@/server/assessment-marks/actions';
import { useQuery } from '@tanstack/react-query';

export function useAssessmentsQuery(moduleId: number) {
  return useQuery({
    queryKey: ['assessments', moduleId],
    queryFn: () => getAssessmentBySemesterModuleId(moduleId),
  });
}

export function useAssessmentMarksQuery(semesterModuleId: number) {
  return useQuery({
    queryKey: ['assessmentMarks', semesterModuleId],
    queryFn: () => getAssessmentMarksByModuleId(semesterModuleId),
  });
}
