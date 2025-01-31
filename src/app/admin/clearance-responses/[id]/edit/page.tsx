import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../Form';
import { getClearanceResponse, updateClearanceResponse } from '@/server/clearance-responses/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ClearanceResponseEdit({ params }: Props) {
  const { id } = await params;
  const clearanceResponse = await getClearanceResponse(Number(id));
  if (!clearanceResponse) {
    return notFound();
  }

  return (
    <Box p={'lg'}>
      <Form
        title={'Edit Clearance Response'}
        defaultValues={clearanceResponse}
        onSubmit={async (value) => {
          'use server';
          return await updateClearanceResponse(Number(id), value);
        }}
      />
    </Box>
  );
}