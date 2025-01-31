'use client';

import { createClearanceResponse } from '@/server/clearance-responses/actions';
import { getClearanceRequest } from '@/server/clearance-requests/actions';
import { Button, Paper, SegmentedControl, Stack } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

type Props = {
  request: NonNullable<Awaited<ReturnType<typeof getClearanceRequest>>>;
  comment: string;
};

export default function ClearanceSwitch({ request, comment }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [value, setValue] = useState<'cleared' | 'not-cleared'>('not-cleared');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (!session?.user?.id) return;
      await createClearanceResponse({
        clearanceRequestId: request.id,
        message: comment,
        department: 'registry',
        clearedBy: session?.user?.id,
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper withBorder p='md'>
      <Stack>
        <SegmentedControl
          value={value}
          onChange={(val) => setValue(val as 'cleared' | 'not-cleared')}
          data={[
            { label: 'Not Cleared', value: 'not-cleared' },
            { label: 'Cleared', value: 'cleared' },
          ]}
          fullWidth
        />
        <Button
          onClick={handleSubmit}
          loading={loading}
          variant={value === 'cleared' ? 'filled' : 'outline'}
          color={value === 'cleared' ? 'green' : 'red'}
        >
          Submit Response
        </Button>
      </Stack>
    </Paper>
  );
}
