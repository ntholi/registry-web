'use client';

import { SegmentedControl, Stack } from '@mantine/core';

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
		<Stack gap={6} w='100%'>
			<SegmentedControl
				size='md'
				fullWidth
				data={RATINGS}
				value={value?.toString() ?? ''}
				onChange={(v) => onChange(Number(v))}
				disabled={disabled}
			/>
		</Stack>
	);
}
