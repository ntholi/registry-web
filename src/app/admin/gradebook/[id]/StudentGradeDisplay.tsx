import { Badge, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getAssessmentGradesByModuleId } from '@/server/assessment-marks/actions';

type Assessment = {
  id: number;
  weight: number;
  totalMarks: number;
};

type AssessmentMark = {
  stdNo: number;
  assessmentId: number;
  marks: number;
  id: number;
};

type AssessmentGrade = {
  id: number;
  assessmentId: number;
  stdNo: number;
  grade: string;
};

type Props = {
  studentId: number;
  assessments: Assessment[] | undefined;
  assessmentMarks: AssessmentMark[] | undefined;
  displayType: 'total' | 'grade';
  moduleId: number;
};

export default function StudentGradeDisplay({
  studentId,
  assessments,
  assessmentMarks,
  displayType,
  moduleId,
}: Props) {
  // Fetch assessment grades
  const { data: assessmentGrades } = useQuery({
    queryKey: ['assessmentGrades', moduleId],
    queryFn: () => getAssessmentGradesByModuleId(moduleId),
  });
  const getStudentMark = (studentId: number, assessmentId: number) => {
    if (!assessmentMarks) return { mark: undefined, markId: undefined };

    const mark = assessmentMarks.find(
      (mark) => mark.stdNo === studentId && mark.assessmentId === assessmentId,
    );

    return {
      mark: mark ? mark.marks : undefined,
      markId: mark ? mark.id : undefined,
    };
  };
  const calculateStudentTotals = (studentId: number) => {
    if (!assessments || !assessmentMarks)
      return { total: 0, hasMarks: false, hasPassed: false };

    let totalWeight = 0;
    let weightedMarks = 0;
    let hasMarks = false;

    assessments.forEach((assessment) => {
      const { mark } = getStudentMark(studentId, assessment.id);
      totalWeight += assessment.weight;

      if (mark !== undefined) {
        const percentage = mark / assessment.totalMarks;
        weightedMarks += percentage * assessment.weight;
        hasMarks = true;
      }
    });

    const total = weightedMarks;

    return {
      total,
      hasMarks,
      hasPassed: total >= totalWeight * 0.5,
    };
  };

  const getLetterGrade = (percentage: number): string => {
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
  };
  const getGradeColor = (grade: string): string => {
    if (['A', 'B', 'C'].some((letter) => grade.startsWith(letter)))
      return 'green';
    if (['PP', 'Def'].includes(grade)) return 'yellow';
    return 'red';
  };

  const { total, hasMarks, hasPassed } = calculateStudentTotals(studentId);

  if (!hasMarks) {
    return (
      <Text c='dimmed' size='sm'>
        -
      </Text>
    );
  }

  if (displayType === 'total') {
    return (
      <Badge
        variant='light'
        color={hasPassed ? 'green' : 'red'}
        radius={'sm'}
        w={43}
      >
        {Math.ceil(total)}
      </Badge>
    );
  }

  // Try to find a saved grade for this student
  const savedGrade = assessmentGrades?.find((grade) => {
    // Find a grade that matches this student and is for one of the assessments in this module
    return (
      grade.stdNo === studentId &&
      assessments?.some((a) => a.id === grade.assessmentId)
    );
  });

  // Use the saved grade if available, otherwise calculate it
  const letterGrade = savedGrade?.grade || getLetterGrade(total);
  const gradeColor = getGradeColor(letterGrade);

  return (
    <Badge variant='light' color={gradeColor} radius={'sm'} w={40}>
      {letterGrade}
    </Badge>
  );
}
