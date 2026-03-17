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
import { useAllTerms } from '@/shared/lib/hooks/use-term';
import { useUserSchools } from '@/shared/lib/hooks/use-user-schools';
import type { ObservationReportFilter } from '../_lib/types';
import { getObservationCyclesByTerm } from '../_server/actions';

type Props = {
	onFilterChange: (filter: ObservationReportFilter) => void;
	hideAdvanced?: boolean;
};

export default function Filter({ onFilterChange, hideAdvanced }: Props) {
	const [localFilter, setLocalFilter] = useQueryStates(
		{
			termId: parseAsInteger,
			cycleId: parseAsString,
			schoolIds: parseAsArrayOf(parseAsInteger),
			programId: parseAsInteger,
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
		});
	}, [localFilter, onFilterChange]);

	const { data: terms = [], isLoading: termsLoading } = useAllTerms();

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
		queryKey: ['observation-cycles-by-term', localFilter.termId],
		queryFn: () => getObservationCyclesByTerm(localFilter.termId!),
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
			setLocalFilter({ schoolIds, programId: null });
			return;
		}
		if (field === 'termId') {
			setLocalFilter({ termId: value ? Number(value) : null, cycleId: null });
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
				<Grid.Col span={{ base: 12, sm: 6, md: hideAdvanced ? 6 : 3 }}>
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

				{!hideAdvanced && (
					<>
						<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
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
								}))}
								rightSection={schoolsLoading && <Loader size='xs' />}
								value={localFilter.schoolIds?.map(String) ?? []}
								onChange={(v) => handleChange('schoolIds', v)}
								searchable
								clearable
							/>
						</Grid.Col>

						<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
							<Select
								label='Program'
								placeholder='All programs'
								data={programs.map((p) => ({
									value: p.id?.toString() || '',
									label: p.code,
								}))}
								rightSection={programsLoading && <Loader size='xs' />}
								value={localFilter.programId?.toString() ?? null}
								onChange={(v) =>
									handleChange('programId', v ? Number(v) : null)
								}
								searchable
								clearable
								disabled={
									!localFilter.schoolIds || localFilter.schoolIds.length === 0
								}
							/>
						</Grid.Col>
					</>
				)}
			</Grid>
		</Paper>
	);
}
