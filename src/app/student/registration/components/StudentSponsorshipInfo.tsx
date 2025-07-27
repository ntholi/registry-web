'use client';

import React from 'react';
import {
  Card,
  Text,
  Group,
  Stack,
  Badge,
  Skeleton,
  Alert,
  Box,
} from '@mantine/core';
import { IconInfoCircle, IconUser } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getSponsoredStudent } from '@/server/sponsors/actions';
import { useCurrentTerm } from '@/hooks/use-current-term';
import useUserStudent from '@/hooks/use-user-student';

export default function StudentSponsorshipInfo() {
  const { student } = useUserStudent();
  const { currentTerm } = useCurrentTerm();

  const {
    data: sponsorshipInfo,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['current-sponsorship', student?.stdNo, currentTerm?.id],
    queryFn: () => getSponsoredStudent(student!.stdNo, currentTerm!.id),
    enabled: !!student?.stdNo && !!currentTerm?.id,
  });

  if (isLoading) {
    return (
      <Card withBorder p='md'>
        <Stack gap='sm'>
          <Group>
            <IconUser size={20} />
            <Text fw={500}>Sponsorship Information</Text>
          </Group>
          <Skeleton height={20} width='60%' />
          <Skeleton height={16} width='40%' />
        </Stack>
      </Card>
    );
  }

  if (error || !sponsorshipInfo) {
    return (
      <Card withBorder p='md'>
        <Alert
          icon={<IconInfoCircle size='1rem' />}
          color='orange'
          variant='light'
        >
          <Text size='sm'>
            No sponsorship information found for the current term. Please update
            your sponsorship details.
          </Text>
        </Alert>
      </Card>
    );
  }

  return (
    <Card withBorder p='md'>
      <Stack gap='sm'>
        <Group>
          <IconUser size={20} />
          <Text fw={500}>Current Sponsorship</Text>
        </Group>

        <Group justify='space-between'>
          <Box>
            <Text size='sm' c='dimmed'>
              Sponsor
            </Text>
            <Text fw={500}>
              {sponsorshipInfo.sponsor?.name || 'Not specified'}
            </Text>
          </Box>

          {sponsorshipInfo.borrowerNo && (
            <Box>
              <Text size='sm' c='dimmed'>
                Borrower Number
              </Text>
              <Text fw={500}>{sponsorshipInfo.borrowerNo}</Text>
            </Box>
          )}
        </Group>

        <Group justify='space-between'>
          <Box>
            <Text size='sm' c='dimmed'>
              Term
            </Text>
            <Text fw={500}>{currentTerm?.name}</Text>
          </Box>

          <Badge
            color={sponsorshipInfo.sponsor ? 'green' : 'orange'}
            variant='light'
            size='sm'
          >
            {sponsorshipInfo.sponsor ? 'Active' : 'Incomplete'}
          </Badge>
        </Group>
      </Stack>
    </Card>
  );
}
