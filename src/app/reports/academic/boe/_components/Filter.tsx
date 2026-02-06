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
import { formatSemester } from '@/shared/lib/utils/utils';

const semesterOptions = Array.from({ length: 8 }, (_, i) => {
	const semesterNumber = (i + 1).toString().padStart(2, '0');
	return {
		value: semesterNumber,
		label: formatSemester(semesterNumber, 'mini'),
	};
});

export interface BoeReportFilter {
	termId?: number;
	schoolIds?: number[];
	programId?: number;
	semesterNumber?: string;
}

interface Props {
	onFilterChange: (filter: BoeReportFilter) => void;
}

export default function BoeFilter({ onFilterChange }: Props) {
	const [localFilter, setLocalFilter] = useQueryStates(
		{
			termId: parseAsInteger,
			schoolIds: parseAsArrayOf(parseAsInteger),
			programId: parseAsInteger,
			semesterNumber: parseAsString,
		},
		{
			history: 'push',
			shallow: false,
		}
	);

	useEffect(() => {
		const newFilter: BoeReportFilter = {
			termId: localFilter.termId ?? undefined,
			schoolIds:
				localFilter.schoolIds && localFilter.schoolIds.length > 0
					? localFilter.schoolIds
					: undefined,
			programId: localFilter.programId ?? undefined,
			semesterNumber: localFilter.semesterNumber ?? undefined,
		};
		onFilterChange(newFilter);
	}, [localFilter, onFilterChange]);

	const { data: termsData = [], isLoading: termsLoading } = useQuery({
		queryKey: ['terms'],
		queryFn: getAllTerms,
	});

	const { data: schoolsData = [], isLoading: schoolsLoading } = useQuery({
		queryKey: ['active-schools'],
		queryFn: getActiveSchools,
	});

	const { data: programsData = [], isLoading: programsLoading } = useQuery({
		queryKey: ['programs-by-school', localFilter.schoolIds],
		queryFn: () => getProgramsBySchoolIds(localFilter.schoolIds ?? undefined),
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

	return (
		<Paper withBorder p='lg'>
			<Group mb='md'>
				<IconFilter size={18} />
				<Text fw={600}>Filters</Text>
			</Group>

			<Group align='flex-end' gap='sm'>
				<Grid gutter='md' style={{ flex: 1 }}>
					<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
						<Select
							label='Term'
							placeholder='Select term'
							data={termsData?.map((term) => ({
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

					<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
						<MultiSelect
							label='Schools'
							placeholder='Select schools'
							data={schoolsData?.map((school) => ({
								value: school.id?.toString() || '',
								label: school.code,
								description: school.name,
							}))}
							rightSection={schoolsLoading && <Loader size='xs' />}
							value={localFilter.schoolIds?.map(String) ?? []}
							onChange={(value) => handleChange('schoolIds', value)}
							searchable
							clearable
							withAsterisk
							renderOption={({ option }) => {
								const customOption = option as {
									value: string;
									label: string;
									description: string;
								};
								return (
									<div>
										<Text size='sm'>{customOption.label}</Text>
										<Text size='xs' c='dimmed'>
											{customOption.description}
										</Text>
									</div>
								);
							}}
						/>
					</Grid.Col>

					<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
						<Select
							label='Program'
							placeholder='All programs'
							data={programsData?.map((program) => ({
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
										<Text size='sm'>{customOption.label}</Text>
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
			</Group>
		</Paper>
	);
}
