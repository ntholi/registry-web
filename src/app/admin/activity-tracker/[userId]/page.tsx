'use client';

import { Stack } from '@mantine/core';
import { parseAsString, useQueryStates } from 'nuqs';
import { use, useMemo } from 'react';
import { getPresetRange } from '../_components/DateRangeFilter';
import EmployeeDetailView from '../_components/EmployeeDetailView';
import type { TimePreset } from '../_lib/types';

type Props = {
	params: Promise<{ userId: string }>;
};

export default function EmployeeDetailPage({ params }: Props) {
	const { userId } = use(params);

	const [qp, setQp] = useQueryStates({
		range: parseAsString.withDefault('7d'),
		start: parseAsString,
		end: parseAsString,
	});

	const preset = qp.range as TimePreset;

	const dateRange = useMemo(() => {
		if (preset === 'custom' && qp.start && qp.end) {
			return { start: new Date(qp.start), end: new Date(qp.end) };
		}
		const p = preset === 'custom' ? '7d' : preset;
		return getPresetRange(p as Exclude<TimePreset, 'custom'>);
	}, [preset, qp.start, qp.end]);

	function handlePresetChange(p: TimePreset) {
		if (p === 'custom') {
			setQp({ range: 'custom' });
		} else {
			setQp({ range: p, start: null, end: null });
		}
	}

	function handleRangeChange(range: { start: Date; end: Date }) {
		setQp({
			start: range.start.toISOString(),
			end: range.end.toISOString(),
		});
	}

	return (
		<Stack>
			<EmployeeDetailView
				userId={userId}
				start={dateRange.start.toISOString()}
				end={dateRange.end.toISOString()}
				preset={preset}
				onPresetChange={handlePresetChange}
				onRangeChange={handleRangeChange}
			/>
		</Stack>
	);
}
