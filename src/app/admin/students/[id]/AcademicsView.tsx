import { getStudent } from '@/server/students/actions';
import React from 'react';

type Props = {
  student: Awaited<ReturnType<typeof getStudent>>;
};

export default function AcademicsView({ student }: Props) {
  return <div>AcademicsView</div>;
}
