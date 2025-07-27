export const studentColors = {
  status: {
    active: 'green',
    approved: 'green',
    registered: 'blue',
    rejected: 'red',
    partial: 'yellow',
    pending: 'gray',
  },
  grade: {
    excellent: 'green',
    good: 'blue',
    average: 'yellow',
    poor: 'red',
  },
  theme: {
    primary: 'gray',
    secondary: 'orange',
    accent: 'violet',
  },
} as const;

export const getStatusColor = (status: string) => {
  const normalizedStatus = status.toLowerCase();
  return (
    studentColors.status[
      normalizedStatus as keyof typeof studentColors.status
    ] || 'gray'
  );
};

export const getGradeColor = (grade: string) => {
  if (['A+', 'A', 'A-'].includes(grade)) return studentColors.grade.excellent;
  if (['B+', 'B', 'B-'].includes(grade)) return studentColors.grade.good;
  if (['C+', 'C', 'C-'].includes(grade)) return studentColors.grade.average;
  return studentColors.grade.poor;
};
