import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../Form';
import { getTerm, updateTerm } from '@/server/terms/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TermEdit({ params }: Props) {
  const { id } = await params;
  const term = await getTerm(Number(id));
  if (!term) {
    return notFound();
  }

  return (
    <Box p={'lg'}>
      <Form
        title={'Edit Term'}
        defaultValues={term}
        onSubmit={async (value) => {
          'use server';
          const updatedTerm = await updateTerm(Number(id), value);
          if (!updatedTerm) {
            throw new Error('Failed to update term');
          }
          return updatedTerm;
        }}
      />
    </Box>
  );
}
