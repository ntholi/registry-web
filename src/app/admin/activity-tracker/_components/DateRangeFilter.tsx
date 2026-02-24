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
	const now = new Date();
	const end = new Date(now);
	const start = new Date(now);

	switch (preset) {
		case 'today':
			start.setHours(0, 0, 0, 0);
			end.setHours(23, 59, 59, 999);
			break;
		case '7d':
			start.setDate(start.getDate() - 7);
			break;
		case '30d':
			start.setDate(start.getDate() - 30);
			break;
		case 'this_month':
			start.setDate(1);
			start.setHours(0, 0, 0, 0);
			break;
		case 'last_month': {
			start.setMonth(start.getMonth() - 1, 1);
			start.setHours(0, 0, 0, 0);
			end.setDate(0);
			end.setHours(23, 59, 59, 999);
			break;
		}
		case 'this_quarter': {
			const q = Math.floor(now.getMonth() / 3) * 3;
			start.setMonth(q, 1);
			start.setHours(0, 0, 0, 0);
			break;
		}
		case 'this_year':
			start.setMonth(0, 1);
			start.setHours(0, 0, 0, 0);
			break;
	}
	return { start, end };
}

const PRESETS = [
	{ label: 'Today', value: 'today' },
	{ label: '7D', value: '7d' },
	{ label: '30D', value: '30d' },
	{ label: 'Month', value: 'this_month' },
	{ label: 'Last Mo', value: 'last_month' },
	{ label: 'Quarter', value: 'this_quarter' },
	{ label: 'Year', value: 'this_year' },
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
