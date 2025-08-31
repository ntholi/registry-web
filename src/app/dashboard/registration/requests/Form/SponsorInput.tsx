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

  const bankOptions = [
    { value: 'SLB', label: 'Standard Lesotho Bank' },
    { value: 'NED', label: 'NetBank' },
    { value: 'FNB', label: 'First National Bank' },
    { value: 'LPB', label: 'Lesotho Post Bank' },
  ];

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
          <Select
            label='Bank Name'
            placeholder='Select bank'
            data={bankOptions}
            value={bankName || null}
            onChange={(value: string | null) => onBankNameChange(value || '')}
            disabled={disabled}
            searchable
            clearable
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
