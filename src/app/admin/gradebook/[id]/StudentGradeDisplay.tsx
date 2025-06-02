import { Badge, Text } from '@mantine/core';

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

type Props = {
  studentId: number;
  assessments: Assessment[] | undefined;
  assessmentMarks: AssessmentMark[] | undefined;
  displayType: 'total' | 'grade';
};

export default function StudentGradeDisplay({
  studentId,
  assessments,
  assessmentMarks,
  displayType,
}: Props) {
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

  const letterGrade = getLetterGrade(total);
  const gradeColor = getGradeColor(letterGrade);

  return (
    <Badge variant='light' color={gradeColor} radius={'sm'} w={40}>
      {letterGrade}
    </Badge>
  );
}
