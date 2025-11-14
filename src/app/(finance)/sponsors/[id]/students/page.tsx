'use client';

import { StudentsTable } from '@finance/sponsors';
import { Paper } from '@mantine/core';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function SponsorStudentsPage({ params }: Props) {
	const { id } = await params;
	return (
		<Paper withBorder p='md'>
			<StudentsTable sponsorId={id} />
		</Paper>
	);
}
