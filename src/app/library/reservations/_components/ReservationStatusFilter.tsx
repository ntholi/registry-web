'use client';

import { Select } from '@mantine/core';
import { IconFilter } from '@tabler/icons-react';

type Props = {
	value: string;
	onChange: (value: string | null) => void;
};

export default function ReservationStatusFilter({ value, onChange }: Props) {
	return (
		<Select
			size='xs'
			placeholder='Filter'
			value={value}
			onChange={onChange}
			leftSection={<IconFilter size={16} />}
			data={[
				{ value: 'all', label: 'All' },
				{ value: 'Active', label: 'Active' },
				{ value: 'Fulfilled', label: 'Fulfilled' },
				{ value: 'Cancelled', label: 'Cancelled' },
				{ value: 'Expired', label: 'Expired' },
			]}
			w={120}
		/>
	);
}
