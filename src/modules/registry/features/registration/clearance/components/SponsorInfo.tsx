'use client';

import { getSponsoredStudent } from '@finance/sponsors/server';
import { Skeleton, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { FieldView } from '@/shared/ui/adease';

type Props = {
	stdNo: number;
	termId: number;
};

export default function SponsorInfo({ stdNo, termId }: Props) {
	const { data: sponsorInfo, isLoading } = useQuery({
		queryKey: ['sponsored-students', stdNo, termId],
		queryFn: () => getSponsoredStudent(stdNo, termId),
	});

	if (isLoading) {
		return (
			<FieldView label='Sponsor' underline={false}>
				<Skeleton height={20} width={150} />
			</FieldView>
		);
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
