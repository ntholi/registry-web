'use client';

import { dashboardUsers, registrationRequestStatusEnum } from '@/db/schema';
import { toTitleCase } from '@/lib/utils';
import {
  createRegistrationClearance,
  getRegistrationClearance,
} from '@/server/registration-clearance/actions';
import { Button, Paper, SegmentedControl, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  request: NonNullable<Awaited<ReturnType<typeof getRegistrationClearance>>>;
  setAccordion: (value: 'comments' | 'modules') => void;
  comment: string;
};

type Status = (typeof registrationRequestStatusEnum)[number];

export default function ClearanceSwitch({
  request,
  comment,
  setAccordion,
}: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>(request.status);

  const { mutate: submitResponse, isPending } = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id || !session.user?.role) {
        throw new Error('User not authenticated');
      }

      return createRegistrationClearance({
        id: request.id,
        registrationRequestId: request.registrationRequestId,
        message: comment,
        department: session.user.role as (typeof dashboardUsers)[number],
        status,
      });
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Response submitted successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({
        queryKey: ['registrationClearances'],
      });
      router.refresh();
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to submit response',
        color: 'red',
      });
      setStatus(request.registrationRequest.status);
    },
  });

  function handleSubmit() {
    submitResponse();
  }

  return (
    <Paper withBorder p='md' py={21}>
      <Stack>
        <SegmentedControl
          value={status}
          onChange={(it) => {
            setStatus(it as Status);
            if ((it as Status) === 'rejected') {
              setAccordion('comments');
            } else setAccordion('modules');
          }}
          data={registrationRequestStatusEnum.map((status) => ({
            label: toTitleCase(status),
            value: status,
          }))}
          fullWidth
          disabled={isPending}
        />
        <Button onClick={handleSubmit} loading={isPending}>
          Submit Response
        </Button>
      </Stack>
    </Paper>
  );
}
