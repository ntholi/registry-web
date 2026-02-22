'use client';

import { Group, SegmentedControl } from '@mantine/core';
import { DatePickerInput, type DatesRangeValue } from '@mantine/dates';
import { useCallback, useMemo } from 'react';
import type { TimePreset } from '../_lib/types';

type DateRangeFilterProps = {
	value: { start: Date; end: Date };
	onChange: (range: { start: Date; end: Date }) => void;
	preset: TimePreset;
	onPresetChange: (preset: TimePreset) => void;
};

function getPresetRange(preset: Exclude<TimePreset, 'custom'>): {
	start: Date;
	end: Date;
} {
	const end = new Date();
	const start = new Date();
	switch (preset) {
		case 'today':
			start.setHours(0, 0, 0, 0);
			break;
		case '7d':
			start.setDate(start.getDate() - 7);
			break;
		case '30d':
			start.setDate(start.getDate() - 30);
			break;
	}
	return { start, end };
}

const PRESETS = [
	{ label: 'Today', value: 'today' },
	{ label: '7 Days', value: '7d' },
	{ label: '30 Days', value: '30d' },
	{ label: 'Custom', value: 'custom' },
];

export default function DateRangeFilter({
	value,
	onChange,
	preset,
	onPresetChange,
}: DateRangeFilterProps) {
	const handlePresetChange = useCallback(
		(val: string) => {
			const p = val as TimePreset;
			onPresetChange(p);
			if (p !== 'custom') {
				onChange(getPresetRange(p));
			}
		},
		[onChange, onPresetChange]
	);

	const handleDateChange = useCallback(
		(val: DatesRangeValue) => {
			const [s, e] = val;
			if (s instanceof Date && e instanceof Date) {
				onChange({ start: s, end: e });
			}
		},
		[onChange]
	);

	const rangeValue = useMemo(
		(): DatesRangeValue => [value.start, value.end],
		[value.start, value.end]
	);

	return (
		<Group>
			<SegmentedControl
				data={PRESETS}
				value={preset}
				onChange={handlePresetChange}
				size='xs'
			/>
			{preset === 'custom' && (
				<DatePickerInput
					type='range'
					value={rangeValue}
					onChange={handleDateChange}
					firstDayOfWeek={0}
					size='xs'
					w={260}
				/>
			)}
		</Group>
	);
}

export { getPresetRange };
