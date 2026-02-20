'use client';

import {
	getActiveSchools,
	getProgramsBySchoolIds,
} from '@academic/schools/_server/actions';
import {
	Grid,
	Group,
	Loader,
	MultiSelect,
	Paper,
	Select,
	Text,
} from '@mantine/core';
import { IconFilter } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import {
	parseAsArrayOf,
	parseAsInteger,
	parseAsString,
	useQueryStates,
} from 'nuqs';
import { useEffect } from 'react';
import { getAllTerms } from '@/app/registry/terms/_server/actions';
import { useUserSchools } from '@/shared/lib/hooks/use-user-schools';
import type { FeedbackReportFilter } from '../_lib/types';
import {
	getFeedbackCyclesByTerm,
	getFeedbackModulesForFilter,
} from '../_server/actions';

type Props = {
	onFilterChange: (filter: FeedbackReportFilter) => void;
};

export default function Filter({ onFilterChange }: Props) {
	const [localFilter, setLocalFilter] = useQueryStates(
		{
			termId: parseAsInteger,
			cycleId: parseAsString,
			schoolIds: parseAsArrayOf(parseAsInteger),
			programId: parseAsInteger,
			moduleId: parseAsInteger,
		},
		{ history: 'push', shallow: false }
	);

	useEffect(() => {
		onFilterChange({
			termId: localFilter.termId ?? undefined,
			cycleId: localFilter.cycleId ?? undefined,
			schoolIds:
				localFilter.schoolIds && localFilter.schoolIds.length > 0
					? localFilter.schoolIds
					: undefined,
			programId: localFilter.programId ?? undefined,
			moduleId: localFilter.moduleId ?? undefined,
		});
	}, [localFilter, onFilterChange]);

	const { data: terms = [], isLoading: termsLoading } = useQuery({
		queryKey: ['terms'],
		queryFn: getAllTerms,
	});

	useEffect(() => {
		if (localFilter.termId || termsLoading || terms.length === 0) return;
		const activeTerm = terms.find((t) => t.isActive);
		if (activeTerm) setLocalFilter({ termId: activeTerm.id });
	}, [localFilter.termId, terms, termsLoading, setLocalFilter]);

	const { userSchools, isLoading: userSchoolsLoading } = useUserSchools();

	useEffect(() => {
		if (localFilter.schoolIds || userSchoolsLoading || userSchools.length === 0)
			return;
		setLocalFilter({ schoolIds: userSchools.map((s) => s.schoolId) });
	}, [localFilter.schoolIds, userSchools, userSchoolsLoading, setLocalFilter]);

	const { data: schools = [], isLoading: schoolsLoading } = useQuery({
		queryKey: ['active-schools'],
		queryFn: getActiveSchools,
	});

	const { data: programs = [], isLoading: programsLoading } = useQuery({
		queryKey: ['programs-by-school', localFilter.schoolIds],
		queryFn: () => getProgramsBySchoolIds(localFilter.schoolIds ?? undefined),
		enabled:
			Boolean(localFilter.schoolIds) && localFilter.schoolIds!.length > 0,
	});

	const { data: cycles = [], isLoading: cyclesLoading } = useQuery({
		queryKey: ['feedback-cycles-by-term', localFilter.termId],
		queryFn: () => getFeedbackCyclesByTerm(localFilter.termId!),
		enabled: Boolean(localFilter.termId),
	});

	const { data: moduleOptions = [], isLoading: modulesLoading } = useQuery({
		queryKey: [
			'feedback-modules-filter',
			localFilter.termId,
			localFilter.schoolIds,
			localFilter.programId,
		],
		queryFn: () =>
			getFeedbackModulesForFilter({
				termId: localFilter.termId ?? undefined,
				schoolIds: localFilter.schoolIds ?? undefined,
				programId: localFilter.programId ?? undefined,
			}),
		enabled: Boolean(localFilter.termId),
	});

	function handleChange(
		field: string,
		value: string | number | string[] | null
	) {
		if (field === 'schoolIds') {
			const schoolIds =
				Array.isArray(value) && value.length > 0
					? value.map((v) => Number(v))
					: null;
			setLocalFilter({ schoolIds, programId: null, moduleId: null });
			return;
		}
		if (field === 'termId') {
			setLocalFilter({
				termId: value ? Number(value) : null,
				cycleId: null,
			});
			return;
		}
		if (field === 'programId') {
			setLocalFilter({
				programId: value ? Number(value) : null,
				moduleId: null,
			});
			return;
		}
		setLocalFilter({
			[field]: value as string | number | null,
		});
	}

	return (
		<Paper withBorder p='lg'>
			<Group mb='md'>
				<IconFilter size={18} />
				<Text fw={600}>Filters</Text>
			</Group>

			<Grid gutter='md'>
				<Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
					<Select
						label='Term'
						placeholder='Select term'
						data={terms.map((t) => ({
							value: t.id?.toString() || '',
							label: t.code,
						}))}
						rightSection={termsLoading && <Loader size='xs' />}
						value={localFilter.termId?.toString() ?? null}
						onChange={(v) => handleChange('termId', v ? Number(v) : null)}
						searchable
						clearable
						withAsterisk
					/>
				</Grid.Col>

				<Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
					<Select
						label='Cycle'
						placeholder='All cycles'
						data={cycles.map((c) => ({
							value: c.id,
							label: c.name,
						}))}
						rightSection={cyclesLoading && <Loader size='xs' />}
						value={localFilter.cycleId ?? null}
						onChange={(v) => handleChange('cycleId', v)}
						searchable
						clearable
						disabled={!localFilter.termId}
					/>
				</Grid.Col>

				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<MultiSelect
						label='Schools'
						placeholder='All schools'
						data={schools.map((s) => ({
							value: s.id?.toString() || '',
							label: s.code,
							description: s.name,
						}))}
						rightSection={schoolsLoading && <Loader size='xs' />}
						value={localFilter.schoolIds?.map(String) ?? []}
						onChange={(v) => handleChange('schoolIds', v)}
						searchable
						clearable
						renderOption={({ option }) => {
							const opt = option as {
								value: string;
								label: string;
								description: string;
							};
							return (
								<div>
									<Text>{opt.label}</Text>
									<Text size='xs' c='dimmed'>
										{opt.description}
									</Text>
								</div>
							);
						}}
					/>
				</Grid.Col>

				<Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
					<Select
						label='Program'
						placeholder='All programs'
						data={programs.map((p) => ({
							value: p.id?.toString() || '',
							label: p.code,
						}))}
						rightSection={programsLoading && <Loader size='xs' />}
						value={localFilter.programId?.toString() ?? null}
						onChange={(v) => handleChange('programId', v ? Number(v) : null)}
						searchable
						clearable
						disabled={
							!localFilter.schoolIds || localFilter.schoolIds.length === 0
						}
					/>
				</Grid.Col>

				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<Select
						label='Module'
						placeholder='All modules'
						data={moduleOptions.map((m) => ({
							value: m.id.toString(),
							label: `${m.code} — ${m.name}`,
						}))}
						rightSection={modulesLoading && <Loader size='xs' />}
						value={localFilter.moduleId?.toString() ?? null}
						onChange={(v) => handleChange('moduleId', v ? Number(v) : null)}
						searchable
						clearable
						disabled={!localFilter.termId}
					/>
				</Grid.Col>
			</Grid>
		</Paper>
	);
}
