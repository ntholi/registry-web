'use client';

import { Paper } from '@mantine/core';
import SponsoredStudentsTable from './_components/SponsoredStudentsTable';

export default function SponsoredStudentsPage() {
	return (
		<Paper withBorder p='md'>
			<SponsoredStudentsTable />
		</Paper>
	);
}
