'use client';
import {
	ActionIcon,
	Badge,
	Button,
	Flex,
	Grid,
	Group,
	Loader,
	Modal,
	Paper,
	RangeSlider,
	Select,
	SimpleGrid,
	Stack,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
	programStatus,
	semesterStatus,
	studentStatus,
} from '@registry/_database/schema/enums';
import {
	IconAdjustments,
	IconFilter,
	IconPlayerPlayFilled,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useEffect } from 'react';
import { formatSemester } from '@/shared/lib/utils/utils';
import {
	getAvailableCountriesForReports,
	getAvailableProgramsForReports,
	getAvailableSchoolsForReports,
	getAvailableSponsorsForReports,
	getAvailableTermsForReport,
} from '../_server/actions';

const semesterOptions = Array.from({ length: 8 }, (_, i) => {
	const semesterNumber = (i + 1).toString().padStart(2, '0');
	return {
		value: semesterNumber,
		label: formatSemester(semesterNumber, 'mini'),
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
	studentStatus?: string;
	programStatus?: string;
	semesterStatus?: string;
}

interface Props {
	onFilterChange: (filter: ReportFilter) => void;
}

export default function EnrollmentFilter({ onFilterChange }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [localFilter, setLocalFilter] = useQueryStates(
		{
			termId: parseAsInteger,
			schoolId: parseAsInteger,
			programId: parseAsInteger,
			semesterNumber: parseAsString,
			gender: parseAsString,
			sponsorId: parseAsInteger,
			ageRangeMin: parseAsInteger.withDefault(12),
			ageRangeMax: parseAsInteger.withDefault(75),
			country: parseAsString,
			studentStatus: parseAsString,
			programStatus: parseAsString,
			semesterStatus: parseAsString,
		},
		{
			history: 'push',
			shallow: false,
		}
	);

	useEffect(() => {
		const newFilter: ReportFilter = {
			termIds: localFilter.termId ? [localFilter.termId] : undefined,
			schoolId: localFilter.schoolId ?? undefined,
			programId: localFilter.programId ?? undefined,
			semesterNumber: localFilter.semesterNumber ?? undefined,
			gender: localFilter.gender ?? undefined,
			sponsorId: localFilter.sponsorId ?? undefined,
			ageRangeMin:
				localFilter.ageRangeMin !== 12 ? localFilter.ageRangeMin : undefined,
			ageRangeMax:
				localFilter.ageRangeMax !== 75 ? localFilter.ageRangeMax : undefined,
			country: localFilter.country ?? undefined,
			studentStatus: localFilter.studentStatus ?? undefined,
			programStatus: localFilter.programStatus ?? undefined,
			semesterStatus: localFilter.semesterStatus ?? undefined,
		};
		onFilterChange(newFilter);
	}, [localFilter, onFilterChange]);

	const hasAgeFilter =
		localFilter.ageRangeMin !== 12 || localFilter.ageRangeMax !== 75;

	const activeFiltersCount =
		[
			localFilter.gender,
			localFilter.sponsorId,
			hasAgeFilter,
			localFilter.country,
			localFilter.studentStatus,
			localFilter.programStatus,
			localFilter.semesterStatus,
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
				localFilter.schoolId ?? undefined
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

	function handleChange(
		field: string,
		value: string | number | [number, number] | null
	) {
		if (Array.isArray(value)) {
			setLocalFilter({
				ageRangeMin: value[0],
				ageRangeMax: value[1],
			});
			return;
		}

		const updates: Record<string, number | string | null> = {
			[field]: value,
		};

		if (field === 'schoolId') {
			updates.programId = null;
			updates.programStatus = null;
		} else if (field === 'programId') {
			updates.programStatus = null;
		} else if (field === 'semesterNumber') {
			updates.semesterStatus = null;
		}

		setLocalFilter(updates);
	}

	return (
		<>
			<Paper withBorder p='lg'>
				<Group mb='md'>
					<IconFilter size={18} />
					<Text fw={600}>Filters</Text>
				</Group>

				<Flex align={'flex-end'} gap={'sm'}>
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

						<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
							<Select
								label='School'
								placeholder='All schools'
								data={schools.map((school) => ({
									value: school.id?.toString() || '',
									label: school.code,
									description: school.name,
								}))}
								rightSection={schoolsLoading && <Loader size='xs' />}
								value={localFilter.schoolId?.toString() ?? null}
								onChange={(value) =>
									handleChange('schoolId', value ? Number(value) : null)
								}
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
						</Grid.Col>

						<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
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

					<Group gap='xs'>
						<Button
							variant='light'
							leftSection={<IconAdjustments size={16} />}
							onClick={open}
							size='sm'
						>
							Filters
							{activeFiltersCount > 0 && (
								<Badge size='sm' circle ml='xs'>
									{activeFiltersCount}
								</Badge>
							)}
						</Button>

						<ActionIcon
							onClick={close}
							disabled={!localFilter.termId}
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
						value={localFilter.gender ?? null}
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
						value={localFilter.sponsorId?.toString() ?? null}
						onChange={(value) =>
							handleChange('sponsorId', value ? Number(value) : null)
						}
						searchable
						clearable
					/>

					<Stack gap='xs'>
						<Text size='sm' fw={500}>
							Age Range: {localFilter.ageRangeMin} - {localFilter.ageRangeMax}{' '}
							years
						</Text>
						<RangeSlider
							value={[localFilter.ageRangeMin, localFilter.ageRangeMax]}
							onChange={(value) => handleChange('ageRange', value)}
							min={12}
							max={75}
							step={1}
							marks={[
								{ value: 12, label: '12' },
								{ value: 18, label: '18' },
								{ value: 25, label: '25' },
								{ value: 35, label: '35' },
								{ value: 45, label: '45' },
								{ value: 55, label: '55' },
								{ value: 75, label: '75' },
							]}
						/>
					</Stack>

					<Select
						label='Country'
						mt={'md'}
						placeholder='All countries'
						data={countries.map((country) => ({
							value: country,
							label: country,
						}))}
						rightSection={countriesLoading && <Loader size='xs' />}
						value={localFilter.country ?? null}
						onChange={(value) => handleChange('country', value)}
						searchable
						clearable
					/>

					<SimpleGrid cols={{ base: 1, sm: 2 }}>
						<Select
							label='Student Status'
							placeholder='All statuses'
							data={studentStatus.enumValues.map((status) => ({
								value: status,
								label: status,
							}))}
							value={localFilter.studentStatus ?? null}
							onChange={(value) => handleChange('studentStatus', value)}
							searchable
							clearable
						/>

						<Select
							label='Program Status'
							placeholder='All statuses'
							data={programStatus.enumValues.map((status) => ({
								value: status,
								label: status,
							}))}
							value={localFilter.programStatus ?? null}
							onChange={(value) => handleChange('programStatus', value)}
							searchable
							clearable
							disabled={!localFilter.programId}
						/>
					</SimpleGrid>
					<Select
						label='Semester Status'
						placeholder='All statuses'
						data={semesterStatus.enumValues.map((status) => ({
							value: status,
							label: status === 'DroppedOut' ? 'Dropped Out' : status,
						}))}
						value={localFilter.semesterStatus ?? null}
						onChange={(value) => handleChange('semesterStatus', value)}
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
