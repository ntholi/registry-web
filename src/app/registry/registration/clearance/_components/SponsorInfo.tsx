'use client';

import { Text } from '@mantine/core';
import { FieldView } from '@/shared/ui/adease';

type Props = {
	sponsorship?: {
		sponsor?: {
			name?: string | null;
		} | null;
		borrowerNo?: string | null;
	} | null;
};

export default function SponsorInfo({ sponsorship }: Props) {
	return (
		<FieldView label='Sponsor' underline={false}>
			<Text fw={500} size='sm'>
				{sponsorship
					? `${sponsorship.sponsor?.name}${sponsorship.borrowerNo ? ` | ${sponsorship.borrowerNo}` : ''}`
					: 'Not Found'}
			</Text>
		</FieldView>
	);
}
