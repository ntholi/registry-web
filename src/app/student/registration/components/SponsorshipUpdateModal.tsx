'use client';

import React, { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  Card,
  TextInput,
  Select,
  LoadingOverlay,
  Alert,
  Button,
  Group,
  Modal,
  Title,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import {
  findAllSponsors,
  getSponsoredStudent,
  updateStudentSponsorshipById,
} from '@/server/sponsors/actions';
import { useCurrentTerm } from '@/hooks/use-current-term';
import useUserStudent from '@/hooks/use-user-student';

type SponsorshipData = {
  sponsorId: number;
  borrowerNo?: string;
};

interface SponsorshipUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSponsorship?: SponsorshipData;
  onUpdate?: (data: SponsorshipData) => void;
}

export function SponsorshipUpdateModal({
  isOpen,
  onClose,
  currentSponsorship,
  onUpdate,
}: SponsorshipUpdateModalProps) {
  const { student } = useUserStudent();
  const { currentTerm } = useCurrentTerm();
  const queryClient = useQueryClient();

  const [sponsorId, setSponsorId] = useState<number | null>(
    currentSponsorship?.sponsorId || null
  );
  const [borrowerNo, setBorrowerNo] = useState(
    currentSponsorship?.borrowerNo || ''
  );

  const { data: sponsorsData, isLoading: sponsorsLoading } = useQuery({
    queryKey: ['sponsors'],
    queryFn: () => findAllSponsors(1, ''),
    select: (data) => data.items || [],
  });

  const sponsors = sponsorsData || [];

  const isNMDS = (id: number | null) => {
    if (!sponsors || !id) return false;
    return sponsors.find((s) => s.id === id)?.name === 'NMDS';
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!student || !currentTerm || !sponsorId) {
        throw new Error('Missing required data');
      }

      return updateStudentSponsorshipById({
        stdNo: student.stdNo,
        termId: currentTerm.id,
        sponsorId,
        borrowerNo: borrowerNo || undefined,
      });
    },
    onSuccess: () => {
      notifications.show({
        title: 'Sponsorship Updated',
        message: 'Your sponsorship information has been updated successfully',
        color: 'green',
      });

      queryClient.invalidateQueries({
        queryKey: ['previous-sponsorship', student?.stdNo, currentTerm?.id],
      });

      if (onUpdate && sponsorId) {
        onUpdate({
          sponsorId,
          borrowerNo: borrowerNo || undefined,
        });
      }

      onClose();
    },
    onError: (error) => {
      notifications.show({
        title: 'Update Failed',
        message: error.message || 'Failed to update sponsorship information',
        color: 'red',
      });
    },
  });

  const handleSponsorChange = (value: string | null) => {
    if (value) {
      const id = parseInt(value);
      setSponsorId(id);

      const selectedSponsor = sponsors.find((s) => s.id === id);
      if (selectedSponsor?.name !== 'NMDS') {
        setBorrowerNo('');
      }
    } else {
      setSponsorId(null);
      setBorrowerNo('');
    }
  };

  const handleSubmit = () => {
    if (sponsorId) {
      updateMutation.mutate();
    }
  };

  const sponsorOptions = sponsors.map((sponsor) => ({
    value: sponsor.id.toString(),
    label: sponsor.name,
  }));

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={<Title order={3}>Update Sponsorship Information</Title>}
      size='md'
    >
      <Stack gap='lg'>
        <Alert icon={<IconInfoCircle size='1rem' />} color='blue'>
          <Text size='sm'>
            Update your sponsorship details. These changes will be applied to
            your current registration.
          </Text>
        </Alert>

        <Card padding='lg' withBorder>
          <Stack gap='md'>
            <Select
              label='Sponsor'
              placeholder='Select your sponsor'
              data={sponsorOptions}
              value={sponsorId?.toString() || null}
              onChange={handleSponsorChange}
              required
              searchable
              disabled={sponsorsLoading}
            />

            {sponsorId && isNMDS(sponsorId) && (
              <TextInput
                label='Borrower Number'
                placeholder='Enter your borrower number'
                value={borrowerNo}
                onChange={(event) => setBorrowerNo(event.currentTarget.value)}
                description='Required for NMDS sponsored students'
                required
              />
            )}
          </Stack>
        </Card>

        <Group justify='flex-end' gap='sm'>
          <Button variant='default' onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!sponsorId}
            loading={updateMutation.isPending}
          >
            Update Sponsorship
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default function SponsorshipQuickUpdate() {
  const [opened, { open, close }] = useDisclosure(false);
  const { student } = useUserStudent();
  const { currentTerm } = useCurrentTerm();

  const { data: currentSponsorship } = useQuery({
    queryKey: ['previous-sponsorship', student?.stdNo, currentTerm?.id],
    queryFn: () => getSponsoredStudent(student!.stdNo, currentTerm!.id),
    enabled: !!student?.stdNo && !!currentTerm?.id,
  });

  return (
    <>
      <Button variant='outline' onClick={open}>
        Update Sponsorship
      </Button>

      <SponsorshipUpdateModal
        isOpen={opened}
        onClose={close}
        currentSponsorship={
          currentSponsorship
            ? {
                sponsorId: currentSponsorship.sponsor?.id || 0,
                borrowerNo: currentSponsorship.borrowerNo || undefined,
              }
            : undefined
        }
      />
    </>
  );
}
