'use client';

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
import { formatSemester } from '@/shared/lib/utils/utils';
import {
	getProgramsForAttendanceReport,
	getSchoolsForAttendanceReport,
	getTermsForAttendanceReport,
} from '../_server/actions';

type Term = { id: number; code: string };

const semesterOptions = Array.from({ length: 8 }, (_, i) => {
	const semesterNumber = (i + 1).toString().padStart(2, '0');
	return {
		value: semesterNumber,
		label: formatSemester(semesterNumber, 'mini'),
	};
});

const weekOptions = Array.from({ length: 16 }, (_, i) => ({
	value: (i + 1).toString(),
	label: `Week ${i + 1}`,
}));

export interface AttendanceReportFilter {
	termId?: number;
	schoolIds?: number[];
	programId?: number;
	semesterNumber?: string;
	weekNumber?: number;
}

type Props = {
	onFilterChange: (filter: AttendanceReportFilter) => void;
};

export default function AttendanceFilter({ onFilterChange }: Props) {
	const [localFilter, setLocalFilter] = useQueryStates(
		{
			termId: parseAsInteger,
			schoolIds: parseAsArrayOf(parseAsInteger),
			programId: parseAsInteger,
			semesterNumber: parseAsString,
			weekNumber: parseAsInteger,
		},
		{
			history: 'push',
			shallow: false,
		}
	);

	useEffect(() => {
		const newFilter: AttendanceReportFilter = {
			termId: localFilter.termId ?? undefined,
			schoolIds:
				localFilter.schoolIds && localFilter.schoolIds.length > 0
					? localFilter.schoolIds
					: undefined,
			programId: localFilter.programId ?? undefined,
			semesterNumber: localFilter.semesterNumber ?? undefined,
			weekNumber: localFilter.weekNumber ?? undefined,
		};
		onFilterChange(newFilter);
	}, [localFilter, onFilterChange]);

	const { data: terms = [], isLoading: termsLoading } = useQuery<Term[]>({
		queryKey: ['attendance-report-terms'],
		queryFn: async () => {
			const result = await getTermsForAttendanceReport();
			return result.success ? (result.data as Term[]) : [];
		},
	});

	const { data: schools = [], isLoading: schoolsLoading } = useQuery({
		queryKey: ['attendance-report-schools'],
		queryFn: async () => {
			const result = await getSchoolsForAttendanceReport();
			return result.success ? result.data : [];
		},
	});

	const { data: programs = [], isLoading: programsLoading } = useQuery({
		queryKey: ['attendance-report-programs', localFilter.schoolIds],
		queryFn: async () => {
			const result = await getProgramsForAttendanceReport(
				localFilter.schoolIds ?? undefined
			);
			return result.success ? result.data : [];
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
						data={
							terms?.map((term) => ({
								value: term.id?.toString() || '',
								label: term.code,
							})) || []
						}
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
					<MultiSelect
						label='Schools'
						placeholder='All schools'
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

				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<Select
						label='Program'
						placeholder='All programs'
						data={programs.map((program) => ({
							value: program.id?.toString() || '',
							label: program.code,
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

				<Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
					<Select
						label='Week'
						placeholder='All weeks'
						data={weekOptions}
						value={localFilter.weekNumber?.toString() ?? null}
						onChange={(value) =>
							handleChange('weekNumber', value ? Number(value) : null)
						}
						searchable
						clearable
					/>
				</Grid.Col>
			</Grid>
		</Paper>
	);
}
