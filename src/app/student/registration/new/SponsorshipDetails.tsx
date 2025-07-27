import React, { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  Card,
  TextInput,
  Select,
  LoadingOverlay,
  Alert,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import {
  findAllSponsors,
  getSponsoredStudent,
} from '@/server/sponsors/actions';
import { useCurrentTerm } from '@/hooks/use-current-term';
import useUserStudent from '@/hooks/use-user-student';

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
  const { student } = useUserStudent();
  const { currentTerm } = useCurrentTerm();

  const [borrowerNo, setBorrowerNo] = useState(
    sponsorshipData?.borrowerNo || ''
  );

  const { data: sponsorsData, isLoading: sponsorsLoading } = useQuery({
    queryKey: ['sponsors'],
    queryFn: () => findAllSponsors(1, ''),
    select: (data) => data.items || [],
  });

  const { data: previousSponsorshipData } = useQuery({
    queryKey: ['previous-sponsorship', student?.stdNo, currentTerm?.id],
    queryFn: () => getSponsoredStudent(student!.stdNo, currentTerm!.id),
    enabled: !!student?.stdNo && !!currentTerm?.id,
  });

  const sponsors = sponsorsData || [];

  const isNMDS = (sponsorId: number) => {
    if (!sponsors) return false;
    return sponsors.find((s) => s.id === sponsorId)?.name === 'NMDS';
  };

  useEffect(() => {
    if (sponsorshipData?.sponsorId && isNMDS(sponsorshipData.sponsorId)) {
      if (previousSponsorshipData?.borrowerNo && !borrowerNo) {
        setBorrowerNo(previousSponsorshipData.borrowerNo);
        onSponsorshipChange({
          sponsorId: sponsorshipData.sponsorId,
          borrowerNo: previousSponsorshipData.borrowerNo,
        });
      }
    }
  }, [
    sponsorshipData?.sponsorId,
    previousSponsorshipData?.borrowerNo,
    sponsors,
  ]);

  const handleSponsorChange = (value: string | null) => {
    if (value) {
      const sponsorId = parseInt(value);
      const selectedSponsor = sponsors.find((s) => s.id === sponsorId);

      let newBorrowerNo = borrowerNo;

      if (
        selectedSponsor?.name === 'NMDS' &&
        previousSponsorshipData?.borrowerNo
      ) {
        newBorrowerNo = previousSponsorshipData.borrowerNo;
        setBorrowerNo(newBorrowerNo);
      } else if (selectedSponsor?.name !== 'NMDS') {
        newBorrowerNo = '';
        setBorrowerNo('');
      }

      onSponsorshipChange({
        sponsorId,
        borrowerNo: newBorrowerNo || undefined,
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

          {sponsorshipData?.sponsorId && isNMDS(sponsorshipData.sponsorId) && (
            <TextInput
              label='Borrower Number'
              placeholder='Enter your borrower number'
              value={borrowerNo}
              onChange={(event) =>
                handleBorrowerNoChange(event.currentTarget.value)
              }
              description='Required for NMDS sponsored students'
              required
            />
          )}
        </Stack>
      </Card>

      <Alert icon={<IconInfoCircle size='1rem' />} color='blue'>
        <Text size='sm'>
          <strong>Important:</strong> Make sure your sponsorship details are
          correct. These details will be used for billing and financial records.
          {sponsorshipData?.sponsorId && isNMDS(sponsorshipData.sponsorId) && (
            <span> For NMDS sponsorship, the borrower number is required.</span>
          )}{' '}
          If you're unsure about your sponsor or borrower number, please contact
          the finance office.
        </Text>
      </Alert>

      {sponsors.length === 0 && !sponsorsLoading && (
        <Alert icon={<IconInfoCircle size='1rem' />} color='orange'>
          No sponsors found. Please contact the administration to set up
          sponsors.
        </Alert>
      )}
    </Stack>
  );
}
