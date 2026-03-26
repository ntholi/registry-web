'use client';

import { getStatusColor } from '@/shared/lib/utils/colors';
import { FilterMenu } from '@/shared/ui/adease';

const options = [
	{ value: 'all', label: 'All', color: 'blue' },
	{ value: 'pending', label: 'Pending', color: getStatusColor('pending') },
	{ value: 'printed', label: 'Printed', color: getStatusColor('approved') },
];

export default function CertificateReprintStatusFilter() {
	return (
		<FilterMenu
			label='Status'
			queryParam='status'
			defaultValue='all'
			options={options}
		/>
	);
}
