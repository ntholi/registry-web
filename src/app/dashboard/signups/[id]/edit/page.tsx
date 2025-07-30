import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../Form';
import { getSignup, updateSignup } from '@/server/signups/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SignupEdit({ params }: Props) {
  const { id } = await params;
  const signup = await getSignup(id);
  if (!signup) {
    return notFound();
  }

  return (
    <Box p={'lg'}>
      <Form
        title={'Edit Signup'}
        defaultValues={signup}
        onSubmit={async (value) => {
          'use server';
          return await updateSignup(id, value);
        }}
      />
    </Box>
  );
}