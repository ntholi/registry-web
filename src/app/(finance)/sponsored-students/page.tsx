'use client';

import { SponsoredStudentsTable } from '@finance/sponsored-students';
import { Paper } from '@mantine/core';

export default function SponsoredStudentsPage() {
	return (
		<Paper withBorder p='md'>
			<SponsoredStudentsTable />
		</Paper>
	);
}
