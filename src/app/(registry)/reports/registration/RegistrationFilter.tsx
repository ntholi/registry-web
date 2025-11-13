'use client';
import {
	ActionIcon,
	Flex,
	Group,
	Loader,
	Paper,
	Select,
	SimpleGrid,
	Text,
} from '@mantine/core';
import { IconFilter, IconPlayerPlayFilled } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
	getAvailableProgramsForReports,
	getAvailableSchoolsForReports,
	getAvailableTermsForReport,
} from '@/server/reports/registration/actions';
import { formatSemester } from '@/shared/lib/utils/utils';

const semesterOptions = Array.from({ length: 8 }, (_, i) => {
	const semesterNumber = (i + 1).toString().padStart(2, '0');
	return {
		value: semesterNumber,
		label: formatSemester(semesterNumber, 'full'),
	};
});

export interface ReportFilter {
	termId?: number;
	schoolId?: number;
	programId?: number;
	semesterNumber?: string;
}

interface Props {
	filter: ReportFilter;
	onFilterChange: (filter: ReportFilter) => void;
}

export default function RegistrationFilter({ filter, onFilterChange }: Props) {
	const [localFilter, setLocalFilter] = useState<{
		termId: string;
		schoolId: string;
		programId: string;
		semesterNumber: string;
	}>({
		termId: filter.termId?.toString() || '',
		schoolId: filter.schoolId?.toString() || '',
		programId: filter.programId?.toString() || '',
		semesterNumber: filter.semesterNumber || '',
	});

	useEffect(() => {
		setLocalFilter({
			termId: filter.termId?.toString() || '',
			schoolId: filter.schoolId?.toString() || '',
			programId: filter.programId?.toString() || '',
			semesterNumber: filter.semesterNumber || '',
		});
	}, [filter]);

	const { data: terms = [], isLoading: termsLoading } = useQuery({
		queryKey: ['registration-report-terms'],
		queryFn: async () => {
			const result = await getAvailableTermsForReport();
			return result.success ? result.data : [];
		},
	});

	const { data: schools = [], isLoading: schoolsLoading } = useQuery({
		queryKey: ['registration-report-schools'],
		queryFn: async () => {
			const result = await getAvailableSchoolsForReports();
			return result.success ? result.data : [];
		},
	});

	const { data: programs = [], isLoading: programsLoading } = useQuery({
		queryKey: ['registration-report-programs', localFilter.schoolId],
		queryFn: async () => {
			const result = await getAvailableProgramsForReports(
				localFilter.schoolId ? Number(localFilter.schoolId) : undefined
			);
			return result.success ? result.data : [];
		},
		enabled: Boolean(localFilter.schoolId),
	});

	useEffect(() => {
		if (localFilter.schoolId !== filter.schoolId?.toString()) {
			setLocalFilter((prev) => ({ ...prev, programId: '' }));
		}
	}, [localFilter.schoolId, filter.schoolId]);

	function handleChange(field: keyof typeof localFilter, value: string | null) {
		const updated = {
			...localFilter,
			[field]: value || '',
			...(field === 'schoolId' && { programId: '' }),
		};

		setLocalFilter(updated);
	}

	function handleApplyFilter() {
		const newFilter: ReportFilter = {
			termId: localFilter.termId ? Number(localFilter.termId) : undefined,
			schoolId: localFilter.schoolId ? Number(localFilter.schoolId) : undefined,
			programId: localFilter.programId
				? Number(localFilter.programId)
				: undefined,
			semesterNumber: localFilter.semesterNumber || undefined,
		};

		onFilterChange(newFilter);
	}

	return (
		<Paper withBorder p='lg'>
			<Group mb='md'>
				<IconFilter size={18} />
				<Text fw={600}>Filters</Text>
			</Group>

			<Flex align={'flex-end'} gap={'sm'}>
				<SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} flex={1} spacing='md'>
					<Select
						label='Academic Term'
						placeholder='Select term'
						data={terms.map((term) => ({
							value: term.id?.toString() || '',
							label: term.name,
						}))}
						rightSection={termsLoading && <Loader size='xs' />}
						value={localFilter.termId || null}
						onChange={(value) => handleChange('termId', value)}
						searchable
						clearable
						withAsterisk
					/>

					<Select
						label='School'
						placeholder='All schools'
						data={schools.map((school) => ({
							value: school.id?.toString() || '',
							label: school.code,
							description: school.name,
						}))}
						rightSection={schoolsLoading && <Loader size='xs' />}
						value={localFilter.schoolId || null}
						onChange={(value) => handleChange('schoolId', value)}
						searchable
						clearable
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

					<Select
						label='Program'
						placeholder='All programs'
						data={programs.map((program) => ({
							value: program.id?.toString() || '',
							label: program.code,
							description: program.name,
						}))}
						rightSection={programsLoading && <Loader size='xs' />}
						value={localFilter.programId || null}
						onChange={(value) => handleChange('programId', value)}
						searchable
						clearable
						disabled={!localFilter.schoolId}
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

					<Select
						label='Semester'
						placeholder='All semesters'
						data={semesterOptions}
						value={localFilter.semesterNumber || null}
						onChange={(value) => handleChange('semesterNumber', value)}
						searchable
						clearable
					/>
				</SimpleGrid>
				<ActionIcon
					onClick={handleApplyFilter}
					disabled={!localFilter.termId}
					variant='light'
					size={35}
				>
					<IconPlayerPlayFilled size={16} />
				</ActionIcon>
			</Flex>
		</Paper>
	);
}
