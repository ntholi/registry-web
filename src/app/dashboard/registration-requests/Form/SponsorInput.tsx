import { findAllSponsors } from '@/server/sponsors/actions';
import { Grid, GridCol, Paper, Select, Text, TextInput } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';

interface SponsorInputProps {
  sponsorId: number;
  borrowerNo?: string;
  bankName?: string;
  accountNumber?: string;
  onSponsorChange: (sponsorId: number) => void;
  onBorrowerNoChange: (borrowerNo: string) => void;
  onBankNameChange: (bankName: string) => void;
  onAccountNumberChange: (accountNumber: string) => void;
  disabled?: boolean;
}

export default function SponsorInput({
  sponsorId,
  borrowerNo,
  bankName,
  accountNumber,
  onSponsorChange,
  onBorrowerNoChange,
  onBankNameChange,
  onAccountNumberChange,
  disabled,
}: SponsorInputProps) {
  const { data: sponsors } = useQuery({
    queryKey: ['sponsors'],
    queryFn: () => findAllSponsors(1),
    select: ({ items }) => items,
  });

  const isNMDS = (id: number) => {
    if (!sponsors) return false;
    return id === sponsors.find((s) => s.name === 'NMDS')?.id;
  };

  return (
    <Paper withBorder p='md'>
      <Text fw={500} mb='sm'>
        Sponsorship Information
      </Text>
      <Grid>
        <GridCol span={6}>
          <Select
            label='Sponsor'
            data={
              sponsors?.map((sponsor) => ({
                value: sponsor.id.toString(),
                label: sponsor.name,
              })) || []
            }
            value={sponsorId?.toString()}
            onChange={(value: string | null) => {
              onSponsorChange(Number(value));
            }}
            placeholder='Select sponsor'
            clearable
            disabled={disabled}
            required
          />
        </GridCol>
        <GridCol span={6}>
          <TextInput
            label='Borrower Number'
            value={borrowerNo}
            onChange={(e) => onBorrowerNoChange(e.currentTarget.value)}
            disabled={!(sponsorId && isNMDS(sponsorId)) || disabled}
          />
        </GridCol>
        <GridCol span={6}>
          <TextInput
            label='Bank Name'
            value={bankName || ''}
            onChange={(e) => onBankNameChange(e.currentTarget.value)}
            disabled={disabled}
          />
        </GridCol>
        <GridCol span={6}>
          <TextInput
            label='Account Number'
            value={accountNumber || ''}
            onChange={(e) => onAccountNumberChange(e.currentTarget.value)}
            disabled={disabled}
          />
        </GridCol>
      </Grid>
    </Paper>
  );
}
