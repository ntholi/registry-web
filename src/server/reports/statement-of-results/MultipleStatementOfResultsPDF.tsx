import React from 'react';
import { Document } from '@react-pdf/renderer';
import StatementOfResultsPDF from '@/app/admin/students/[id]/AcademicsView/statements/StatementOfResultsPDF';
import { getStudent } from '@/server/students/actions';

type StudentData = NonNullable<Awaited<ReturnType<typeof getStudent>>>;

interface MultipleStatementOfResultsPDFProps {
  students: StudentData[];
}

export default function MultipleStatementOfResultsPDF({
  students,
}: MultipleStatementOfResultsPDFProps) {
  return (
    <Document>
      {students.map((student) => (
        <StatementOfResultsPDF key={student.stdNo} student={student} />
      ))}
    </Document>
  );
}
