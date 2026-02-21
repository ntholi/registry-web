'use client';

import { Select } from '@mantine/core';

type Props = {
	value: string;
	onChange: (value: string | null) => void;
};

const STATUS_OPTIONS = [
	{ value: 'all', label: 'All Statuses' },
	{ value: 'pending', label: 'Pending' },
	{ value: 'verified', label: 'Verified' },
	{ value: 'rejected', label: 'Rejected' },
];

export default function DocumentStatusFilter({ value, onChange }: Props) {
	return (
		<Select
			data={STATUS_OPTIONS}
			value={value}
			onChange={onChange}
			size='xs'
			w={140}
			allowDeselect={false}
		/>
	);
}
