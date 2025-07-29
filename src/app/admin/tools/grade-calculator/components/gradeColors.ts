export const getGradeColor = (grade: string) => {
  if (['A+', 'A', 'A-'].includes(grade)) return 'green';
  if (['B+', 'B', 'B-'].includes(grade)) return 'blue';
  if (['C+', 'C', 'C-'].includes(grade)) return 'orange';
  if (['PP'].includes(grade)) return 'yellow';
  if (['F', 'FX', 'FIN'].includes(grade)) return 'red';
  return 'gray';
};

export const getPointsColor = (points: number | null) => {
  if (points === null) return 'gray';
  if (points >= 4.0) return 'green';
  if (points >= 3.0) return 'blue';
  if (points >= 2.0) return 'orange';
  return 'red';
};
