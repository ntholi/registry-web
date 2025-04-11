import { assessmentNumberEnum } from '@/db/schema';

export interface AssessmentModel {
  id: number;
  studentModuleId: number;
  termId: number;
  assessmentNumber: (typeof assessmentNumberEnum)[number];
  assessmentType: string;
  totalMarks: number;
  weight: number;
  createdAt?: number;
}

export const getAssessmentNumberOptions = () => {
  return assessmentNumberEnum.map((value) => ({
    value,
    label: value.replace('CW', 'Course Work '),
  }));
};
