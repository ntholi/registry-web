'use client';
import {
	ActionIcon,
	Badge,
	Button,
	Flex,
	Group,
	Loader,
	Modal,
	MultiSelect,
	NumberInput,
	Paper,
	Select,
	SimpleGrid,
	Stack,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
	IconAdjustments,
	IconFilter,
	IconPlayerPlayFilled,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { formatSemester } from '@/shared/lib/utils/utils';
import {
	getAvailableCountriesForReports,
	getAvailableProgramsForReports,
	getAvailableSchoolsForReports,
	getAvailableSponsorsForReports,
	getAvailableTermsForReport,
} from '../server/actions';

const semesterOptions = Array.from({ length: 8 }, (_, i) => {
	const semesterNumber = (i + 1).toString().padStart(2, '0');
	return {
		value: semesterNumber,
		label: formatSemester(semesterNumber, 'full'),
	};
});

export interface ReportFilter {
	termIds?: number[];
	schoolId?: number;
	programId?: number;
	semesterNumber?: string;
	gender?: string;
	sponsorId?: number;
	ageRangeMin?: number;
	ageRangeMax?: number;
	country?: string;
}

interface Props {
	filter: ReportFilter;
	onFilterChange: (filter: ReportFilter) => void;
}

export default function RegistrationFilter({ filter, onFilterChange }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [localFilter, setLocalFilter] = useState<{
		termIds: string[];
		schoolId: string;
		programId: string;
		semesterNumber: string;
		gender: string;
		sponsorId: string;
		ageRangeMin: string;
		ageRangeMax: string;
		country: string;
	}>({
		termIds: filter.termIds?.map((id) => id.toString()) || [],
		schoolId: filter.schoolId?.toString() || '',
		programId: filter.programId?.toString() || '',
		semesterNumber: filter.semesterNumber || '',
		gender: filter.gender || '',
		sponsorId: filter.sponsorId?.toString() || '',
		ageRangeMin: filter.ageRangeMin?.toString() || '',
		ageRangeMax: filter.ageRangeMax?.toString() || '',
		country: filter.country || '',
	});

	useEffect(() => {
		setLocalFilter({
			termIds: filter.termIds?.map((id) => id.toString()) || [],
			schoolId: filter.schoolId?.toString() || '',
			programId: filter.programId?.toString() || '',
			semesterNumber: filter.semesterNumber || '',
			gender: filter.gender || '',
			sponsorId: filter.sponsorId?.toString() || '',
			ageRangeMin: filter.ageRangeMin?.toString() || '',
			ageRangeMax: filter.ageRangeMax?.toString() || '',
			country: filter.country || '',
		});
	}, [filter]);

	const activeFiltersCount =
		[
			localFilter.gender,
			localFilter.sponsorId,
			localFilter.ageRangeMin,
			localFilter.ageRangeMax,
			localFilter.country,
		].filter(Boolean).length || 0;

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

	const { data: sponsors = [], isLoading: sponsorsLoading } = useQuery({
		queryKey: ['registration-report-sponsors'],
		queryFn: async () => {
			const result = await getAvailableSponsorsForReports();
			return result.success ? result.data : [];
		},
	});

	const { data: countries = [], isLoading: countriesLoading } = useQuery({
		queryKey: ['registration-report-countries'],
		queryFn: async () => {
			const result = await getAvailableCountriesForReports();
			return result.success ? result.data : [];
		},
	});

	useEffect(() => {
		if (localFilter.schoolId !== filter.schoolId?.toString()) {
			setLocalFilter((prev) => ({ ...prev, programId: '' }));
		}
	}, [localFilter.schoolId, filter.schoolId]);

	function handleChange(
		field: keyof typeof localFilter,
		value: string | string[] | null
	) {
		const updated = {
			...localFilter,
			[field]: Array.isArray(value) ? value : value || '',
			...(field === 'schoolId' && { programId: '' }),
		};

		setLocalFilter(updated);
	}

	function handleApplyFilter() {
		const newFilter: ReportFilter = {
			termIds:
				localFilter.termIds.length > 0
					? localFilter.termIds.map((id) => Number(id))
					: undefined,
			schoolId: localFilter.schoolId ? Number(localFilter.schoolId) : undefined,
			programId: localFilter.programId
				? Number(localFilter.programId)
				: undefined,
			semesterNumber: localFilter.semesterNumber || undefined,
			gender: localFilter.gender || undefined,
			sponsorId: localFilter.sponsorId
				? Number(localFilter.sponsorId)
				: undefined,
			ageRangeMin: localFilter.ageRangeMin
				? Number(localFilter.ageRangeMin)
				: undefined,
			ageRangeMax: localFilter.ageRangeMax
				? Number(localFilter.ageRangeMax)
				: undefined,
			country: localFilter.country || undefined,
		};

		onFilterChange(newFilter);
	}

	return (
		<>
			<Paper withBorder p='lg'>
				<Group mb='md'>
					<IconFilter size={18} />
					<Text fw={600}>Filters</Text>
				</Group>

				<Flex align={'flex-end'} gap={'sm'}>
					<SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} flex={1} spacing='md'>
						<MultiSelect
							label='Academic Terms'
							placeholder='Select terms'
							data={terms.map((term) => ({
								value: term.id?.toString() || '',
								label: term.name,
							}))}
							rightSection={termsLoading && <Loader size='xs' />}
							value={localFilter.termIds}
							onChange={(value) => handleChange('termIds', value)}
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

					<Group gap='xs'>
						<Button
							variant='light'
							leftSection={<IconAdjustments size={16} />}
							onClick={open}
							size='sm'
						>
							More Filters
							{activeFiltersCount > 0 && (
								<Badge size='sm' circle ml='xs'>
									{activeFiltersCount}
								</Badge>
							)}
						</Button>

						<ActionIcon
							onClick={handleApplyFilter}
							disabled={localFilter.termIds.length === 0}
							variant='light'
							size={35}
						>
							<IconPlayerPlayFilled size={16} />
						</ActionIcon>
					</Group>
				</Flex>
			</Paper>

			<Modal
				opened={opened}
				onClose={close}
				title='Additional Filters'
				size='lg'
			>
				<Stack gap='md'>
					<Select
						label='Gender'
						placeholder='All genders'
						data={[
							{ value: 'Male', label: 'Male' },
							{ value: 'Female', label: 'Female' },
						]}
						value={localFilter.gender || null}
						onChange={(value) => handleChange('gender', value)}
						clearable
					/>

					<Select
						label='Sponsor'
						placeholder='All sponsors'
						data={sponsors.map((sponsor) => ({
							value: sponsor.id?.toString() || '',
							label: sponsor.name,
						}))}
						rightSection={sponsorsLoading && <Loader size='xs' />}
						value={localFilter.sponsorId || null}
						onChange={(value) => handleChange('sponsorId', value)}
						searchable
						clearable
					/>

					<Group grow>
						<NumberInput
							label='Age Range Min'
							placeholder='Min age'
							value={localFilter.ageRangeMin || ''}
							onChange={(value) =>
								handleChange('ageRangeMin', value?.toString() || '')
							}
							min={0}
							max={100}
						/>

						<NumberInput
							label='Age Range Max'
							placeholder='Max age'
							value={localFilter.ageRangeMax || ''}
							onChange={(value) =>
								handleChange('ageRangeMax', value?.toString() || '')
							}
							min={0}
							max={100}
						/>
					</Group>

					<Select
						label='Country'
						placeholder='All countries'
						data={countries.map((country) => ({
							value: country,
							label: country,
						}))}
						rightSection={countriesLoading && <Loader size='xs' />}
						value={localFilter.country || null}
						onChange={(value) => handleChange('country', value)}
						searchable
						clearable
					/>

					<Group justify='flex-end' mt='md'>
						<Button variant='default' onClick={close}>
							Close
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
