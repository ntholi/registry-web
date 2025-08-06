'use client';

import StudentsTable from './StudentsTable';
import { Paper } from '@mantine/core';

type Props = {
  params: { id: string };
};

export default function SponsorStudentsPage({ params }: Props) {
  return (
    <Paper withBorder p='md'>
      <StudentsTable sponsorId={params.id} />
    </Paper>
  );
}
