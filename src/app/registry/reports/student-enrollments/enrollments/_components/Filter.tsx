'use client';
import {
	type ProgramLevel,
	programLevelEnum,
} from '@academic/_database/schema/enums';
import {
	getActiveSchools,
	getProgramsBySchoolIds,
} from '@academic/schools/_server/actions';
import {
	Badge,
	Box,
	Button,
	Chip,
	Divider,
	Flex,
	Grid,
	Group,
	Loader,
	Modal,
	MultiSelect,
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
import { getAllTerms } from '@registry/dates/terms/_server/actions';
import { IconAdjustments, IconFilter } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import {
	parseAsArrayOf,
	parseAsInteger,
	parseAsString,
	useQueryStates,
} from 'nuqs';
import { useEffect, useMemo, useRef } from 'react';
import { formatSemester } from '@/shared/lib/utils/utils';
import {
	getAvailableCountriesForReports,
	getAvailableSponsorsForReports,
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
	schoolIds?: number[];
	programId?: number;
	programLevels?: ProgramLevel[];
	semesterNumber?: string;
	gender?: string;
	sponsorId?: number;
	ageRangeMin?: number;
	ageRangeMax?: number;
	country?: string;
	studentStatus?: string;
	programStatus?: string;
	semesterStatuses?: string[];
	visibleColumns?: string[];
}

const BASE_COLUMNS = [
	{ value: 'stdNo', label: 'Student No.' },
	{ value: 'name', label: 'Name' },
	{ value: 'gender', label: 'Gender' },
	{ value: 'program', label: 'Program' },
	{ value: 'semester', label: 'Semester' },
	{ value: 'school', label: 'School' },
	{ value: 'sponsor', label: 'Sponsor' },
];

const FILTER_COLUMNS = [
	{ value: 'programLevel', label: 'Program Level', filterKey: 'programLevels' },
	{ value: 'country', label: 'Country', filterKey: 'country' },
	{
		value: 'studentStatus',
		label: 'Student Status',
		filterKey: 'studentStatus',
	},
	{
		value: 'programStatus',
		label: 'Program Status',
		filterKey: 'programStatus',
	},
	{
		value: 'semesterStatus',
		label: 'Semester Status',
		filterKey: 'semesterStatuses',
	},
	{ value: 'age', label: 'Age', filterKey: 'ageRange' },
];

const EXTRA_COLUMNS = [
	{ value: 'email', label: 'Email' },
	{ value: 'phone', label: 'Phone Number' },
	{ value: 'birthDate', label: 'Birth Date' },
	{ value: 'birthPlace', label: 'Birth Place' },
	{ value: 'nationalId', label: 'National ID' },
	{ value: 'passportNo', label: 'Passport No.' },
	{ value: 'address', label: 'Address' },
	{ value: 'intake', label: 'Intake' },
	{ value: 'registrationDate', label: 'Registration Date' },
];

export function getDefaultVisibleColumns(): string[] {
	return BASE_COLUMNS.map((col) => col.value);
}

interface Props {
	onFilterChange: (filter: ReportFilter) => void;
}

export default function EnrollmentFilter({ onFilterChange }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [localFilter, setLocalFilter] = useQueryStates(
		{
			termId: parseAsInteger,
			schoolIds: parseAsArrayOf(parseAsInteger),
			programId: parseAsInteger,
			programLevels: parseAsArrayOf(parseAsString),
			semesterNumber: parseAsString,
			gender: parseAsString,
			sponsorId: parseAsInteger,
			ageRangeMin: parseAsInteger.withDefault(12),
			ageRangeMax: parseAsInteger.withDefault(75),
			country: parseAsString,
			studentStatus: parseAsString,
			programStatus: parseAsString,
			semesterStatuses: parseAsArrayOf(parseAsString),
			visibleColumns: parseAsArrayOf(parseAsString),
		},
		{
			history: 'push',
			shallow: false,
		}
	);

	const hasAgeFilter =
		localFilter.ageRangeMin !== 12 || localFilter.ageRangeMax !== 75;

	const activeFilterColumnKeys = useMemo(() => {
		const activeColumns: string[] = [];
		if (localFilter.programLevels && localFilter.programLevels.length > 0) {
			activeColumns.push('programLevel');
		}
		if (localFilter.country) {
			activeColumns.push('country');
		}
		if (localFilter.studentStatus) {
			activeColumns.push('studentStatus');
		}
		if (localFilter.programStatus) {
			activeColumns.push('programStatus');
		}
		if (
			localFilter.semesterStatuses &&
			localFilter.semesterStatuses.length > 0
		) {
			activeColumns.push('semesterStatus');
		}
		if (hasAgeFilter) {
			activeColumns.push('age');
		}
		return activeColumns;
	}, [
		localFilter.programLevels,
		localFilter.country,
		localFilter.studentStatus,
		localFilter.programStatus,
		localFilter.semesterStatuses,
		hasAgeFilter,
	]);

	const prevActiveFilterColumnsRef = useRef<string[]>([]);

	useEffect(() => {
		const prevKeys = prevActiveFilterColumnsRef.current;
		const newKeys = activeFilterColumnKeys.filter(
			(key) => !prevKeys.includes(key)
		);

		if (newKeys.length > 0) {
			const currentCols =
				localFilter.visibleColumns ?? getDefaultVisibleColumns();
			const updatedCols = [...new Set([...currentCols, ...newKeys])];
			setLocalFilter({ visibleColumns: updatedCols });
		}

		prevActiveFilterColumnsRef.current = activeFilterColumnKeys;
	}, [activeFilterColumnKeys, setLocalFilter, localFilter.visibleColumns]);

	const userSelectedColumns = useMemo(
		() =>
			localFilter.visibleColumns && localFilter.visibleColumns.length > 0
				? localFilter.visibleColumns
				: getDefaultVisibleColumns(),
		[localFilter.visibleColumns]
	);

	useEffect(() => {
		const newFilter: ReportFilter = {
			termIds: localFilter.termId ? [localFilter.termId] : undefined,
			schoolIds:
				localFilter.schoolIds && localFilter.schoolIds.length > 0
					? localFilter.schoolIds
					: undefined,
			programId: localFilter.programId ?? undefined,
			programLevels:
				localFilter.programLevels && localFilter.programLevels.length > 0
					? (localFilter.programLevels as ProgramLevel[])
					: undefined,
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
			semesterStatuses:
				localFilter.semesterStatuses && localFilter.semesterStatuses.length > 0
					? localFilter.semesterStatuses
					: undefined,
			visibleColumns: userSelectedColumns,
		};
		onFilterChange(newFilter);
	}, [localFilter, onFilterChange, userSelectedColumns]);

	const availableFilterColumns = FILTER_COLUMNS.filter((col) =>
		activeFilterColumnKeys.includes(col.value)
	);

	const selectedExtraColumns = EXTRA_COLUMNS.filter((col) =>
		userSelectedColumns.includes(col.value)
	);

	const availableExtraColumns = EXTRA_COLUMNS.filter(
		(col) => !userSelectedColumns.includes(col.value)
	);

	function handleAddColumn(value: string | null) {
		if (!value) return;
		const currentCols =
			localFilter.visibleColumns ?? getDefaultVisibleColumns();
		if (!currentCols.includes(value)) {
			setLocalFilter({ visibleColumns: [...currentCols, value] });
		}
	}

	const activeFiltersCount =
		[
			localFilter.gender,
			localFilter.sponsorId,
			hasAgeFilter,
			localFilter.country,
			localFilter.studentStatus,
			localFilter.programStatus,
			localFilter.semesterStatuses && localFilter.semesterStatuses.length > 0,
			localFilter.programLevels && localFilter.programLevels.length > 0,
		].filter(Boolean).length || 0;

	const { data: terms = [], isLoading: termsLoading } = useQuery({
		queryKey: ['terms'],
		queryFn: getAllTerms,
	});

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
		value: string | number | [number, number] | string[] | null
	) {
		if (
			Array.isArray(value) &&
			value.length === 2 &&
			typeof value[0] === 'number'
		) {
			setLocalFilter({
				ageRangeMin: value[0] as number,
				ageRangeMax: value[1] as number,
			});
			return;
		}

		if (field === 'schoolIds') {
			const schoolIds =
				Array.isArray(value) && value.length > 0
					? value.map((v) => Number(v))
					: null;
			setLocalFilter({
				schoolIds,
				programId: null,
				programStatus: null,
			});
			return;
		}

		if (field === 'programLevels') {
			setLocalFilter({
				programLevels: Array.isArray(value) ? (value as string[]) : null,
			});
			return;
		}

		if (field === 'semesterStatuses') {
			setLocalFilter({
				semesterStatuses: Array.isArray(value) ? (value as string[]) : null,
			});
			return;
		}

		const updates: Record<
			string,
			string | number | string[] | number[] | null
		> = {
			[field]: value as string | number | string[] | number[] | null,
		};

		if (field === 'programId') {
			updates.programStatus = null;
		} else if (field === 'semesterNumber') {
			updates.semesterStatuses = null;
		}

		setLocalFilter(updates as Partial<typeof localFilter>);
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
							<MultiSelect
								label='Schools'
								placeholder='Schools'
								data={schools.map((school) => ({
									value: school.id?.toString() || '',
									label: school.code,
									description: school.name,
								}))}
								rightSection={schoolsLoading && <Loader size='xs' />}
								value={localFilter.schoolIds?.map(String) ?? []}
								onChange={(value) => handleChange('schoolIds', value)}
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
											<Text>{customOption.label}</Text>
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
					<MultiSelect
						label='Program Level'
						placeholder='All levels'
						data={programLevelEnum.enumValues.map((level) => ({
							value: level,
							label: level.charAt(0).toUpperCase() + level.slice(1),
						}))}
						value={localFilter.programLevels ?? []}
						onChange={(value) => handleChange('programLevels', value)}
						clearable
					/>

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
					<MultiSelect
						label='Semester Status'
						placeholder='All statuses'
						data={semesterStatus.enumValues.map((status) => ({
							value: status,
							label: status === 'DroppedOut' ? 'Dropped Out' : status,
						}))}
						value={localFilter.semesterStatuses ?? []}
						onChange={(value) => handleChange('semesterStatuses', value)}
						searchable
						clearable
					/>

					<Divider my='sm' label='Visible Columns' labelPosition='center' />

					<Select
						placeholder='Add more columns...'
						data={availableExtraColumns}
						value={null}
						onChange={handleAddColumn}
						searchable
						clearable
						nothingFoundMessage='No columns available'
					/>

					<Box>
						<Chip.Group
							multiple
							value={userSelectedColumns}
							onChange={(value) =>
								setLocalFilter({
									visibleColumns: value.length > 0 ? value : null,
								})
							}
						>
							<Group gap='xs'>
								{BASE_COLUMNS.map((col) => (
									<Chip key={col.value} value={col.value} size='xs'>
										{col.label}
									</Chip>
								))}
								{availableFilterColumns.map((col) => (
									<Chip key={col.value} value={col.value} size='xs'>
										{col.label}
									</Chip>
								))}
								{selectedExtraColumns.map((col) => (
									<Chip key={col.value} value={col.value} size='xs'>
										{col.label}
									</Chip>
								))}
							</Group>
						</Chip.Group>
					</Box>
				</Stack>
			</Modal>
		</>
	);
}
