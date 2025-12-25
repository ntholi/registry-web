'use client';
import {
	ActionIcon,
	Flex,
	Grid,
	Group,
	Loader,
	MultiSelect,
	Paper,
	Select,
	Text,
} from '@mantine/core';
import { IconFilter, IconPlayerPlayFilled } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import {
	parseAsArrayOf,
	parseAsInteger,
	parseAsString,
	useQueryStates,
} from 'nuqs';
import { useEffect } from 'react';
import { formatSemester } from '@/shared/lib/utils/utils';
import {
	getDistributionPrograms,
	getDistributionSchools,
	getDistributionTerms,
} from '../_server/actions';
import {
	DISTRIBUTION_OPTIONS,
	type DistributionReportFilter,
	type DistributionType,
} from '../types';

const semesterOptions = Array.from({ length: 8 }, (_, i) => {
	const semesterNumber = (i + 1).toString().padStart(2, '0');
	return {
		value: semesterNumber,
		label: formatSemester(semesterNumber, 'mini'),
	};
});

interface ProgramOption {
	id: number;
	code: string;
	name: string;
	schoolId: number;
}

interface Props {
	onFilterChange: (
		filter: DistributionReportFilter,
		type: DistributionType | null
	) => void;
}

export default function DistributionFilter({ onFilterChange }: Props) {
	const [localFilter, setLocalFilter] = useQueryStates(
		{
			termId: parseAsInteger,
			schoolIds: parseAsArrayOf(parseAsInteger),
			programId: parseAsInteger,
			semesterNumber: parseAsString,
			distributionType: parseAsString,
		},
		{
			history: 'push',
			shallow: false,
		}
	);

	useEffect(() => {
		const newFilter: DistributionReportFilter = {
			termIds: localFilter.termId ? [localFilter.termId] : undefined,
			schoolIds:
				localFilter.schoolIds && localFilter.schoolIds.length > 0
					? localFilter.schoolIds
					: undefined,
			programId: localFilter.programId ?? undefined,
			semesterNumber: localFilter.semesterNumber ?? undefined,
		};
		onFilterChange(
			newFilter,
			(localFilter.distributionType as DistributionType) ?? null
		);
	}, [localFilter, onFilterChange]);

	const { data: terms = [], isLoading: termsLoading } = useQuery({
		queryKey: ['distribution-terms'],
		queryFn: async () => {
			const result = await getDistributionTerms();
			return result.success ? result.data : [];
		},
	});

	const { data: schools = [], isLoading: schoolsLoading } = useQuery({
		queryKey: ['distribution-schools'],
		queryFn: async () => {
			const result = await getDistributionSchools();
			return result.success ? result.data : [];
		},
	});

	const { data: programs = [], isLoading: programsLoading } = useQuery<
		ProgramOption[]
	>({
		queryKey: ['distribution-programs', localFilter.schoolIds],
		queryFn: async () => {
			const result = await getDistributionPrograms(
				localFilter.schoolIds ?? undefined
			);
			return result.success ? (result.data as ProgramOption[]) : [];
		},
		enabled:
			Boolean(localFilter.schoolIds) && localFilter.schoolIds!.length > 0,
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
			setLocalFilter({
				schoolIds,
				programId: null,
			});
			return;
		}

		const updates: Record<string, number | string | null> = {
			[field]: value as number | string | null,
		};

		setLocalFilter(updates);
	}

	const canGenerate = Boolean(
		localFilter.termId && localFilter.distributionType
	);

	return (
		<Paper withBorder p='lg'>
			<Group mb='md'>
				<IconFilter size={18} />
				<Text fw={600}>Distribution Filters</Text>
			</Group>

			<Flex align='flex-end' gap='sm'>
				<Grid gutter='md' flex={1}>
					<Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
						<Select
							label='Term'
							placeholder='Select term'
							data={terms.map((term) => ({
								value: term.id?.toString() || '',
								label: term.code,
							}))}
							rightSection={termsLoading && <Loader size='xs' />}
							value={localFilter.termId?.toString() ?? null}
							onChange={(value) =>
								handleChange('termId', value ? Number(value) : null)
							}
							searchable
							clearable
							withAsterisk
						/>
					</Grid.Col>

					<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
						<Select
							label='Distribution Type'
							placeholder='Select type'
							data={DISTRIBUTION_OPTIONS}
							value={localFilter.distributionType ?? null}
							onChange={(value) => handleChange('distributionType', value)}
							withAsterisk
						/>
					</Grid.Col>

					<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
						<MultiSelect
							label='Schools'
							placeholder='Schools'
							data={schools.map((school) => ({
								value: school.id?.toString() || '',
								label: school.code,
							}))}
							rightSection={schoolsLoading && <Loader size='xs' />}
							value={localFilter.schoolIds?.map(String) ?? []}
							onChange={(value) => handleChange('schoolIds', value)}
							searchable
							clearable
						/>
					</Grid.Col>

					<Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
						<Select
							label='Program'
							placeholder='All programs'
							data={programs.map((program) => ({
								value: program.id?.toString() || '',
								label: program.code,
								description: program.name,
							}))}
							rightSection={programsLoading && <Loader size='xs' />}
							value={localFilter.programId?.toString() ?? null}
							onChange={(value) =>
								handleChange('programId', value ? Number(value) : null)
							}
							searchable
							clearable
							disabled={
								!localFilter.schoolIds || localFilter.schoolIds.length === 0
							}
							renderOption={({ option }) => {
								const customOption = option as {
									value: string;
									label: string;
									description: string;
								};
								return (
									<div>
										<Text>{customOption.label}</Text>
										<Text size='xs' c='dimmed'>
											{customOption.description}
										</Text>
									</div>
								);
							}}
						/>
					</Grid.Col>

					<Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
						<Select
							label='Semester'
							placeholder='All semesters'
							data={semesterOptions}
							value={localFilter.semesterNumber ?? null}
							onChange={(value) => handleChange('semesterNumber', value)}
							searchable
							clearable
						/>
					</Grid.Col>
				</Grid>

				<ActionIcon disabled={!canGenerate} variant='light' size={35}>
					<IconPlayerPlayFilled size={16} />
				</ActionIcon>
			</Flex>
		</Paper>
	);
}
