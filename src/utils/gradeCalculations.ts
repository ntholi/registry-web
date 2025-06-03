import { gradeEnum } from '@/db/schema';

export type GradeCalculation = {
  weightedTotal: number;
  grade: (typeof gradeEnum)[number];
  hasMarks: boolean;
  hasPassed: boolean;
};

export function calculateModuleGrade(
  assessments: Array<{
    id: number;
    weight: number;
    totalMarks: number;
  }>,
  assessmentMarks: Array<{
    assessment_id: number;
    marks: number;
  }>,
): GradeCalculation {
  let totalWeight = 0;
  let weightedMarks = 0;
  let hasMarks = false;

  assessments.forEach((assessment) => {
    totalWeight += assessment.weight;

    const markRecord = assessmentMarks.find(
      (mark) => mark.assessment_id === assessment.id,
    );

    if (markRecord && markRecord.marks !== undefined) {
      const percentage = markRecord.marks / assessment.totalMarks;
      weightedMarks += percentage * assessment.weight;
      hasMarks = true;
    }
  });
  const weightedTotal = Math.ceil(weightedMarks);
  const grade = getLetterGrade(weightedTotal);
  const hasPassed = weightedTotal >= totalWeight * 0.5;

  return {
    weightedTotal,
    grade,
    hasMarks,
    hasPassed,
  };
}

export function getLetterGrade(percentage: number): (typeof gradeEnum)[number] {
  if (percentage >= 90) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 80) return 'A-';
  if (percentage >= 75) return 'B+';
  if (percentage >= 70) return 'B';
  if (percentage >= 65) return 'B-';
  if (percentage >= 60) return 'C+';
  if (percentage >= 55) return 'C';
  if (percentage >= 50) return 'C-';
  if (percentage >= 45) return 'PP';
  return 'F';
}
