import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../Form';
import { getClearanceRequest, updateClearanceRequest } from '@/server/clearance-requests/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ClearanceRequestEdit({ params }: Props) {
  const { id } = await params;
  const clearanceRequest = await getClearanceRequest(Number(id));
  if (!clearanceRequest) {
    return notFound();
  }

  return (
    <Box p={'lg'}>
      <Form
        title={'Edit Clearance Request'}
        defaultValues={clearanceRequest}
        onSubmit={async (value) => {
          'use server';
          return await updateClearanceRequest(Number(id), value);
        }}
      />
    </Box>
  );
}