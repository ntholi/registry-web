import React, { useState } from 'react';
import {
  Stack,
  Text,
  Card,
  Alert,
  Checkbox,
  Button,
  LoadingOverlay,
  Group,
} from '@mantine/core';
import { IconInfoCircle, IconCheck } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { confirmAccountDetails } from '@/server/sponsors/actions';
import { useCurrentTerm } from '@/hooks/use-current-term';
import useUserStudent from '@/hooks/use-user-student';

type SponsorshipData = {
  sponsorId: number;
  borrowerNo?: string;
  bankName?: string;
  accountNumber?: string;
};

interface AccountConfirmationProps {
  sponsorshipData: SponsorshipData | null;
  onConfirmationChange: (confirmed: boolean) => void;
  loading: boolean;
}

export default function AccountConfirmation({
  sponsorshipData,
  onConfirmationChange,
  loading,
}: AccountConfirmationProps) {
  const { student } = useUserStudent();
  const { currentTerm } = useCurrentTerm();
  const queryClient = useQueryClient();
  const [confirmed, setConfirmed] = useState(false);

  const confirmationMutation = useMutation({
    mutationFn: async () => {
      if (!student || !currentTerm) {
        throw new Error('Missing student or term data');
      }
      return confirmAccountDetails(student.stdNo, currentTerm.id);
    },
    onSuccess: () => {
      notifications.show({
        title: 'Account Details Confirmed',
        message: 'Your account details have been successfully confirmed',
        color: 'green',
        icon: <IconCheck size='1rem' />,
      });
      onConfirmationChange(true);
      queryClient.invalidateQueries({ queryKey: ['previous-sponsorship'] });
    },
    onError: (error) => {
      notifications.show({
        title: 'Confirmation Failed',
        message: error.message || 'Failed to confirm account details',
        color: 'red',
      });
    },
  });

  const handleCheckboxChange = (checked: boolean) => {
    setConfirmed(checked);
  };

  const handleConfirm = () => {
    if (confirmed) {
      confirmationMutation.mutate();
    }
  };

  if (loading) {
    return (
      <div style={{ position: 'relative', minHeight: 200 }}>
        <LoadingOverlay visible />
      </div>
    );
  }

  return (
    <Stack gap='lg' mt='md'>
      <Card padding='lg' withBorder>
        <Stack gap='md'>
          <Text size='lg' fw={600}>
            Confirm Account Details
          </Text>

          <Alert icon={<IconInfoCircle size='1rem' />} color='blue'>
            <Text size='sm'>
              <strong>Please review your account details below:</strong>
            </Text>
          </Alert>

          <Card
            padding='md'
            withBorder
            bg='gray.0'
            style={{ borderStyle: 'dashed' }}
          >
            <Stack gap='sm'>
              <Group justify='space-between'>
                <Text size='sm' fw={500}>
                  Bank Name:
                </Text>
                <Text size='sm'>
                  {sponsorshipData?.bankName || 'Not provided'}
                </Text>
              </Group>

              <Group justify='space-between'>
                <Text size='sm' fw={500}>
                  Account Number:
                </Text>
                <Text size='sm'>
                  {sponsorshipData?.accountNumber || 'Not provided'}
                </Text>
              </Group>

              {sponsorshipData?.borrowerNo && (
                <Group justify='space-between'>
                  <Text size='sm' fw={500}>
                    Borrower Number:
                  </Text>
                  <Text size='sm'>{sponsorshipData.borrowerNo}</Text>
                </Group>
              )}
            </Stack>
          </Card>

          <Checkbox
            label='I confirm that all the account details above are correct'
            checked={confirmed}
            onChange={(event) =>
              handleCheckboxChange(event.currentTarget.checked)
            }
            size='sm'
          />

          <Button
            onClick={handleConfirm}
            disabled={!confirmed}
            loading={confirmationMutation.isPending}
            leftSection={<IconCheck size='1rem' />}
          >
            Confirm Account Details
          </Button>
        </Stack>
      </Card>

      <Alert icon={<IconInfoCircle size='1rem' />} color='orange'>
        <Text size='sm'>
          <strong>Important:</strong> Once you confirm your account details, you
          cannot change them without contacting the finance office. Please
          ensure all information is accurate before confirming.
        </Text>
      </Alert>
    </Stack>
  );
}
