import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../Form';
import { getLecturer, updateLecturer } from '@/server/lecturers/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LecturerEdit({ params }: Props) {
  const { id } = await params;
  const lecturer = await getLecturer(Number(id));
  if (!lecturer) {
    return notFound();
  }

  return (
    <Box p={'lg'}>
      <Form
        title={'Edit Lecturer'}
        defaultValues={lecturer}
        onSubmit={async (value) => {
          'use server';
          return await updateLecturer(Number(id), value);
        }}
      />
    </Box>
  );
}