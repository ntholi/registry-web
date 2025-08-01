'use client';

import { clearanceRequestStatusEnum, dashboardUsers } from '@/db/schema';
import { toTitleCase } from '@/lib/utils';
import {
  createRegistrationClearance,
  getRegistrationClearance,
} from '@/server/clearance/actions';
import { Button, Paper, SegmentedControl, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

type Props = {
  request: NonNullable<Awaited<ReturnType<typeof getRegistrationClearance>>>;
  setAccordion: (value: 'comments' | 'modules') => void;
  comment?: string;
};

type Status = Exclude<
  (typeof clearanceRequestStatusEnum)[number],
  'registered'
>;

export default function ClearanceSwitch({
  request,
  comment,
  setAccordion,
}: Props) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>(request.status as Status);
  const [isStatusChanged, setIsStatusChanged] = useState(false);

  useEffect(() => {
    setIsStatusChanged(status !== request.status);
  }, [status, request.status]);

  const { mutate: submitResponse, isPending } = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id || !session.user?.role) {
        throw new Error('User not authenticated');
      }

      const result = await createRegistrationClearance({
        id: request.id,
        registrationRequestId: request.registrationRequestId,
        message: comment,
        department: session.user.role as (typeof dashboardUsers)[number],
        status,
      });
      return { result };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['registrationClearances', 'pending'],
      });
      queryClient.invalidateQueries({
        queryKey: ['registrationClearances', 'approved'],
      });
      queryClient.invalidateQueries({
        queryKey: ['registrationClearances', 'rejected'],
      });
      notifications.show({
        title: 'Success',
        message: 'Registration clearance updated successfully',
        color: 'green',
      });
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to submit response',
        color: 'red',
      });
      setStatus(request.registrationRequest.status as Status);
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
          data={clearanceRequestStatusEnum.map((status) => ({
            label: toTitleCase(status),
            value: status,
          }))}
          fullWidth
          disabled={isPending}
        />
        <Button
          onClick={handleSubmit}
          loading={isPending}
          variant={isStatusChanged ? 'filled' : 'default'}
        >
          Submit Response
        </Button>
      </Stack>
    </Paper>
  );
}
