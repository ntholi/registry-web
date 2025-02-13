'use client';

import { registrationRequestStatusEnum } from '@/db/schema';
import { toTitleCase } from '@/lib/utils';
import { updateRegistrationRequest } from '@/server/registration-requests/actions';
import { Button, Paper, SegmentedControl, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

type Props = {
  request: {
    id: number;
    status: (typeof registrationRequestStatusEnum)[number];
  };
  comment?: string;
  setAccordion?: (value: 'comments' | 'modules') => void;
  disabled?: boolean;
};

type Status = (typeof registrationRequestStatusEnum)[number];

export default function RequestStatusSwitch({
  request,
  comment,
  setAccordion,
  disabled,
}: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>(request.status);
  const [isStatusChanged, setIsStatusChanged] = useState(false);

  useEffect(() => {
    setIsStatusChanged(status !== request.status);
  }, [status, request.status]);

  const { mutate: submitResponse, isPending } = useMutation({
    mutationFn: async () => {
      const result = await updateRegistrationRequest({
        id: request.id,
        status,
        message: comment,
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['registrationRequests'],
      });
      notifications.show({
        title: 'Success',
        message: 'Registration request updated successfully',
        color: 'green',
      });
      router.replace('/admin/registration-requests');
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update registration request',
        color: 'red',
      });
      setStatus(request.status);
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
            if ((it as Status) === 'rejected' && setAccordion) {
              setAccordion('comments');
            } else if (setAccordion) {
              setAccordion('modules');
            }
          }}
          data={registrationRequestStatusEnum.map((status) => ({
            label: toTitleCase(status),
            value: status,
          }))}
          disabled={disabled}
        />
        <Button
          onClick={handleSubmit}
          loading={isPending}
          disabled={!isStatusChanged || disabled}
        >
          Submit Response
        </Button>
      </Stack>
    </Paper>
  );
}
