'use client';

import { programLevelEnum } from '@academic/_database';
import {
	getActiveSchools,
	getProgramsBySchoolIds,
} from '@academic/schools/_server/actions';
import { applicationStatusEnum } from '@admissions/applications/_schema/applications';
import { findActiveIntakePeriods } from '@admissions/intake-periods/_server/actions';
import {
	Button,
	Flex,
	Grid,
	MultiSelect,
	Paper,
	Select,
	Stack,
} from '@mantine/core';
import { IconFilter } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import {
	parseAsArrayOf,
	parseAsInteger,
	parseAsString,
	useQueryStates,
} from 'nuqs';
import type { AdmissionReportFilter as AdmissionReportFilterType } from './types';

interface Props {
	onFilterChange: (filter: AdmissionReportFilterType) => void;
}

export default function AdmissionReportFilter({ onFilterChange }: Props) {
	const [filter, setFilter] = useQueryStates(
		{
			intakePeriodId: parseAsString,
			schoolIds: parseAsArrayOf(parseAsInteger),
			programId: parseAsInteger,
			programLevels: parseAsArrayOf(parseAsString),
			applicationStatuses: parseAsArrayOf(parseAsString),
		},
		{ history: 'push', shallow: false }
	);

	const { data: intakePeriods } = useQuery({
		queryKey: ['intake-periods-active'],
		queryFn: findActiveIntakePeriods,
	});

	const { data: schools } = useQuery({
		queryKey: ['schools-active'],
		queryFn: getActiveSchools,
	});

	const { data: programs } = useQuery({
		queryKey: ['programs-by-schools', filter.schoolIds],
		queryFn: () => getProgramsBySchoolIds(filter.schoolIds ?? undefined),
		enabled: (filter.schoolIds ?? []).length > 0,
	});

	function handleApply() {
		onFilterChange({
			intakePeriodId: filter.intakePeriodId ?? undefined,
			schoolIds: filter.schoolIds ?? undefined,
			programId: filter.programId ?? undefined,
			programLevels:
				(filter.programLevels as AdmissionReportFilterType['programLevels']) ??
				undefined,
			applicationStatuses:
				(filter.applicationStatuses as AdmissionReportFilterType['applicationStatuses']) ??
				undefined,
		});
	}

	return (
		<Paper withBorder p='md'>
			<Stack gap='sm'>
				<Grid>
					<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
						<Select
							label='Intake Period'
							placeholder='All intake periods'
							clearable
							data={
								intakePeriods?.map((ip) => ({
									value: ip.id,
									label: ip.name,
								})) ?? []
							}
							value={filter.intakePeriodId}
							onChange={(val) => setFilter({ intakePeriodId: val })}
						/>
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
						<MultiSelect
							label='School'
							placeholder='All schools'
							clearable
							data={
								schools?.map((s) => ({
									value: s.id.toString(),
									label: s.name,
								})) ?? []
							}
							value={filter.schoolIds?.map(String) ?? []}
							onChange={(vals) =>
								setFilter({
									schoolIds: vals.map(Number),
									programId: null,
								})
							}
						/>
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
						<Select
							label='Program'
							placeholder='All programs'
							clearable
							searchable
							data={
								programs?.map((p) => ({
									value: p.id.toString(),
									label: p.name,
								})) ?? []
							}
							value={filter.programId?.toString() ?? null}
							onChange={(val) =>
								setFilter({ programId: val ? Number(val) : null })
							}
							disabled={!filter.schoolIds?.length}
						/>
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
						<MultiSelect
							label='Program Level'
							placeholder='All levels'
							clearable
							data={programLevelEnum.enumValues.map((lv) => ({
								value: lv,
								label: lv.charAt(0).toUpperCase() + lv.slice(1),
							}))}
							value={filter.programLevels ?? []}
							onChange={(vals) => setFilter({ programLevels: vals })}
						/>
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
						<MultiSelect
							label='Application Status'
							placeholder='All statuses'
							clearable
							data={applicationStatusEnum.enumValues.map((s) => ({
								value: s,
								label: s
									.replace(/_/g, ' ')
									.replace(/\b\w/g, (c) => c.toUpperCase()),
							}))}
							value={filter.applicationStatuses ?? []}
							onChange={(vals) => setFilter({ applicationStatuses: vals })}
						/>
					</Grid.Col>
					<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
						<Flex align='end' h='100%'>
							<Button
								leftSection={<IconFilter size={16} />}
								onClick={handleApply}
							>
								Apply Filters
							</Button>
						</Flex>
					</Grid.Col>
				</Grid>
			</Stack>
		</Paper>
	);
}
