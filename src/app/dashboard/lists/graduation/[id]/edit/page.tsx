import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../Form';
import {
  getGraduationList,
  updateGraduationList,
} from '@/server/lists/graduation/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GraduationListEdit({ params }: Props) {
  const { id } = await params;
  const graduationList = await getGraduationList(id);
  if (!graduationList) {
    return notFound();
  }

  return (
    <Box p={'lg'}>
      <Form
        title={'Edit Graduation List'}
        defaultValues={graduationList}
        onSubmit={async (value) => {
          'use server';
          return await updateGraduationList(id, value);
        }}
      />
    </Box>
  );
}
