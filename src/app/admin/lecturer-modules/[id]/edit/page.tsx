import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../Form';
import {
  getLecturesModule,
  updateLecturesModule,
} from '@/server/lecturer-modules/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LecturesModuleEdit({ params }: Props) {
  const { id } = await params;
  const lecturesModule = await getLecturesModule(Number(id));
  if (!lecturesModule) {
    return notFound();
  }

  return (
    <Box p={'lg'}>
      <Form
        title={'Edit Lectures Module'}
        defaultValues={lecturesModule}
        onSubmit={async (value) => {
          'use server';
          return await updateLecturesModule(Number(id), value);
        }}
      />
    </Box>
  );
}
