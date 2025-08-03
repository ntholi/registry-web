'use client';

import { findAllSponsors } from '@/server/sponsors/actions';
import { Grid, GridCol, Paper, Select, TextInput, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';

interface SponsorshipData {
  sponsorId: number;
  borrowerNo?: string;
}

interface SponsorSelectorProps {
  value: SponsorshipData;
  onChange: (value: SponsorshipData) => void;
  errors?: {
    sponsorId?: string;
    borrowerNo?: string;
  };
}

export default function SponsorSelector({
  value,
  onChange,
  errors,
}: SponsorSelectorProps) {
  const { data: sponsors, isLoading: sponsorsLoading } = useQuery({
    queryKey: ['sponsors'],
    queryFn: () => findAllSponsors(1),
    select: ({ items }) => items,
  });

  const isNMDS = (sponsorId: number) => {
    return sponsors?.find((s) => s.id === sponsorId)?.name === 'NMDS';
  };

  const handleSponsorChange = (sponsorValue: string | null) => {
    const sponsorId = sponsorValue ? parseInt(sponsorValue) : 0;
    onChange({
      sponsorId,
      borrowerNo: !isNMDS(sponsorId) ? '' : value.borrowerNo,
    });
  };

  const handleBorrowerNoChange = (borrowerNo: string) => {
    onChange({
      ...value,
      borrowerNo,
    });
  };

  return (
    <Paper withBorder p='md'>
      <Title order={4} size='h5' mb='md'>
        Sponsorship Details
      </Title>
      <Paper withBorder p='md'>
        <Grid>
          <GridCol span={6}>
            <Select
              label='Sponsor'
              placeholder='Select sponsor'
              data={
                sponsors?.map((sponsor) => ({
                  value: sponsor.id.toString(),
                  label: sponsor.name,
                })) || []
              }
              value={value.sponsorId?.toString() || null}
              onChange={handleSponsorChange}
              error={errors?.sponsorId}
              required
              disabled={sponsorsLoading}
              loading={sponsorsLoading}
            />
          </GridCol>
          <GridCol span={6}>
            <TextInput
              label='Borrower Number'
              placeholder='Enter borrower number'
              value={value.borrowerNo || ''}
              onChange={(event) =>
                handleBorrowerNoChange(event.currentTarget.value)
              }
              disabled={!value.sponsorId || !isNMDS(value.sponsorId)}
              required={isNMDS(value.sponsorId)}
              error={errors?.borrowerNo}
            />
          </GridCol>
        </Grid>
      </Paper>
    </Paper>
  );
}
