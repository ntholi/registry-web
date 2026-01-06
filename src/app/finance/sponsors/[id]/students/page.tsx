'use client';

import { Paper } from '@mantine/core';
import StudentsTable from '../../_components/StudentsTable';

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
