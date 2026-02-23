'use client';

import { programLevelEnum } from '@academic/_database';
import {
	getActiveSchools,
	getProgramsBySchoolIds,
} from '@academic/schools/_server/actions';
import { applicationStatusEnum } from '@admissions/applications/_schema/applications';
import { findActiveIntakePeriods } from '@admissions/intake-periods/_server/actions';
import {
	ActionIcon,
	Button,
	Group,
	Indicator,
	Modal,
	MultiSelect,
	Paper,
	Select,
	Stack,
	Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconAdjustments, IconFilter } from '@tabler/icons-react';
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
	const [opened, { open, close }] = useDisclosure(false);
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

	const modalFilterCount =
		(filter.programLevels?.length ?? 0) +
		(filter.applicationStatuses?.length ?? 0);

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
		close();
	}

	return (
		<>
			<Paper withBorder p='sm'>
				<Group gap='sm' wrap='nowrap'>
					<Select
						flex={1}
						placeholder='Intake Period'
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
					<MultiSelect
						flex={1}
						placeholder='School'
						clearable
						data={
							schools?.map((s) => ({
								value: s.id.toString(),
								label: s.code,
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
					<Select
						flex={1}
						placeholder='Program'
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
					<Tooltip label='More filters'>
						<Indicator
							size={16}
							label={modalFilterCount}
							disabled={modalFilterCount === 0}
						>
							<ActionIcon variant='default' size='input-sm' onClick={open}>
								<IconAdjustments size={18} />
							</ActionIcon>
						</Indicator>
					</Tooltip>
					<Button leftSection={<IconFilter size={16} />} onClick={handleApply}>
						Apply
					</Button>
				</Group>
			</Paper>

			<Modal opened={opened} onClose={close} title='Additional Filters'>
				<Stack gap='md'>
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
					<Button
						leftSection={<IconFilter size={16} />}
						onClick={handleApply}
						fullWidth
					>
						Apply Filters
					</Button>
				</Stack>
			</Modal>
		</>
	);
}
