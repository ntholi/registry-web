'use client';

import { Paper } from '@mantine/core';
import SponsoredStudentsTable from '@/modules/finance/features/sponsored-students/components/SponsoredStudentsTable';

export default function SponsoredStudentsPage() {
	return (
		<Paper withBorder p='md'>
			<SponsoredStudentsTable />
		</Paper>
	);
}
