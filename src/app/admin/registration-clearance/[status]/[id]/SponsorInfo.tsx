'use client';

import { FieldView } from '@/components/adease';
import { Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getSponsoredStudent as getSponsor } from '@/server/sponsors/actions';

type Props = {
  stdNo: number;
  termId: number;
};

export default function SponsorInfo({ stdNo, termId }: Props) {
  const { data: sponsorInfo, isLoading } = useQuery({
    queryKey: ['sponsoredStudents', stdNo, termId],
    queryFn: () => getSponsor(stdNo, termId),
  });

  if (isLoading) {
    return <Text size='sm'>Loading Sponsor...</Text>;
  }

  return (
    <FieldView label='Sponsor' underline={false}>
      <Text fw={500} size='sm'>
        {sponsorInfo
          ? `${sponsorInfo.sponsor?.name}${sponsorInfo.borrowerNo ? ` | ${sponsorInfo.borrowerNo}` : ''}`
          : 'Not Found'}
      </Text>
    </FieldView>
  );
}
