'use client';

import { Select } from '@mantine/core';

type Props = {
	value: string;
	onChange: (value: string | null) => void;
};

const TYPE_OPTIONS = [
	{ value: 'all', label: 'All Types' },
	{ value: 'identity', label: 'Identity' },
	{ value: 'certificate', label: 'Certificate' },
	{ value: 'academic_record', label: 'Academic Record' },
];

export default function DocumentTypeFilter({ value, onChange }: Props) {
	return (
		<Select
			data={TYPE_OPTIONS}
			value={value}
			onChange={onChange}
			size='xs'
			w={150}
			allowDeselect={false}
		/>
	);
}
