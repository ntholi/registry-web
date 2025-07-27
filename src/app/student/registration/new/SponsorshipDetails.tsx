import React, { useState } from 'react';
import {
  Stack,
  Text,
  Card,
  TextInput,
  Select,
  LoadingOverlay,
  Alert,
  Title,
  Group,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { findAllSponsors } from '@/server/sponsors/actions';

type SponsorshipData = {
  sponsorId: number;
  borrowerNo?: string;
};

interface SponsorshipDetailsProps {
  sponsorshipData: SponsorshipData | null;
  onSponsorshipChange: (data: SponsorshipData) => void;
  loading: boolean;
}

export default function SponsorshipDetails({
  sponsorshipData,
  onSponsorshipChange,
  loading,
}: SponsorshipDetailsProps) {
  const [borrowerNo, setBorrowerNo] = useState(
    sponsorshipData?.borrowerNo || ''
  );

  // Fetch available sponsors from database
  const { data: sponsorsData, isLoading: sponsorsLoading } = useQuery({
    queryKey: ['sponsors'],
    queryFn: () => findAllSponsors(1, ''),
    select: (data) => data.items || [],
  });

  const sponsors = sponsorsData || [];

  const handleSponsorChange = (value: string | null) => {
    if (value) {
      const sponsorId = parseInt(value);
      onSponsorshipChange({
        sponsorId,
        borrowerNo: borrowerNo || undefined,
      });
    }
  };

  const handleBorrowerNoChange = (value: string) => {
    setBorrowerNo(value);
    if (sponsorshipData) {
      onSponsorshipChange({
        ...sponsorshipData,
        borrowerNo: value || undefined,
      });
    }
  };

  const sponsorOptions = sponsors.map((sponsor) => ({
    value: sponsor.id.toString(),
    label: sponsor.name,
  }));

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
          <Select
            label='Sponsor'
            placeholder='Select your sponsor'
            data={sponsorOptions}
            value={sponsorshipData?.sponsorId?.toString() || null}
            onChange={handleSponsorChange}
            required
            searchable
            disabled={sponsorsLoading}
          />

          <TextInput
            label='Borrower Number'
            placeholder='Enter your borrower number (if applicable)'
            value={borrowerNo}
            onChange={(event) =>
              handleBorrowerNoChange(event.currentTarget.value)
            }
            description='This is optional - only provide if your sponsor requires a borrower number'
          />
        </Stack>
      </Card>

      <Alert icon={<IconInfoCircle size='1rem' />} color='blue'>
        <Text size='sm'>
          <strong>Important:</strong> Make sure your sponsorship details are
          correct. These details will be used for billing and financial records.
          If you're unsure about your sponsor or borrower number, please contact
          the finance office.
        </Text>
      </Alert>

      {sponsorshipData && (
        <Card
          padding='md'
          withBorder
          style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}
        >
          <Group justify='space-between'>
            <Text size='sm' fw={500}>
              Selected Sponsor:
            </Text>
            <Text size='sm'>
              {sponsors.find((s) => s.id === sponsorshipData.sponsorId)?.name ||
                'Unknown'}
            </Text>
          </Group>
          {sponsorshipData.borrowerNo && (
            <Group justify='space-between'>
              <Text size='sm' fw={500}>
                Borrower Number:
              </Text>
              <Text size='sm'>{sponsorshipData.borrowerNo}</Text>
            </Group>
          )}
        </Card>
      )}

      {sponsors.length === 0 && !sponsorsLoading && (
        <Alert icon={<IconInfoCircle size='1rem' />} color='orange'>
          No sponsors found. Please contact the administration to set up
          sponsors.
        </Alert>
      )}
    </Stack>
  );
}
