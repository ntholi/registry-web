'use client';

import { SegmentedControl } from '@mantine/core';

type RatingInputProps = {
	value: number | null;
	onChange: (value: number) => void;
	disabled?: boolean;
};

const RATINGS = ['1', '2', '3', '4', '5'];

export default function RatingInput({
	value,
	onChange,
	disabled,
}: RatingInputProps) {
	return (
		<SegmentedControl
			size='xs'
			data={RATINGS}
			value={value?.toString() ?? ''}
			onChange={(v) => onChange(Number(v))}
			disabled={disabled}
		/>
	);
}
