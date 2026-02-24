'use client';

import { Group, Select, Stack, Title } from '@mantine/core';
import { useSession } from 'next-auth/react';
import { parseAsString, useQueryStates } from 'nuqs';
import { useMemo } from 'react';
import DailyTrendsChart from './_components/DailyTrendsChart';
import DateRangeFilter, { getPresetRange } from './_components/DateRangeFilter';
import DepartmentOverview from './_components/DepartmentOverview';
import EmployeeList from './_components/EmployeeList';
import type { TimePreset } from './_lib/types';

const DEPARTMENTS = [
	{ value: 'registry', label: 'Registry' },
	{ value: 'finance', label: 'Finance' },
	{ value: 'academic', label: 'Academic' },
	{ value: 'library', label: 'Library' },
	{ value: 'resource', label: 'Resource' },
	{ value: 'marketing', label: 'Marketing' },
	{ value: 'student_services', label: 'Student Services' },
	{ value: 'leap', label: 'LEAP' },
];

export default function ActivityTrackerPage() {
	const { data: session } = useSession();
	const isAdmin = session?.user?.role === 'admin';

	const [params, setParams] = useQueryStates({
		range: parseAsString.withDefault('7d'),
		start: parseAsString,
		end: parseAsString,
		dept: parseAsString,
	});

	const preset = params.range as TimePreset;

	const dateRange = useMemo(() => {
		if (preset === 'custom' && params.start && params.end) {
			return { start: new Date(params.start), end: new Date(params.end) };
		}
		const p = preset === 'custom' ? '7d' : preset;
		return getPresetRange(p as Exclude<TimePreset, 'custom'>);
	}, [preset, params.start, params.end]);

	const dept = isAdmin ? (params.dept ?? undefined) : undefined;

	const start = dateRange.start.toISOString();
	const end = dateRange.end.toISOString();

	function handlePresetChange(p: TimePreset) {
		if (p === 'custom') {
			setParams({ range: 'custom' });
		} else {
			setParams({ range: p, start: null, end: null });
		}
	}

	function handleRangeChange(range: { start: Date; end: Date }) {
		setParams({
			start: range.start.toISOString(),
			end: range.end.toISOString(),
		});
	}

	function handleDeptChange(val: string | null) {
		setParams({ dept: val ?? null });
	}

	return (
		<Stack>
			<Group justify='space-between'>
				<Group>
					<Title order={3}>Activity Tracker</Title>
					{isAdmin && (
						<Select
							data={DEPARTMENTS}
							value={dept ?? null}
							onChange={handleDeptChange}
							size='xs'
							w={180}
							clearable
							placeholder='All Departments'
						/>
					)}
				</Group>
				<DateRangeFilter
					value={dateRange}
					onChange={handleRangeChange}
					preset={preset}
					onPresetChange={handlePresetChange}
				/>
			</Group>

			<DepartmentOverview start={start} end={end} dept={dept} />
			<DailyTrendsChart start={start} end={end} dept={dept} />
			<EmployeeList start={start} end={end} dept={dept} />
		</Stack>
	);
}
