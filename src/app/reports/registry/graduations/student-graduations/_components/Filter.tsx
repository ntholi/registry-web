'use client';
import { type ProgramLevel, programLevelEnum } from '@academic/_database';
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
	Stack,
	Text,
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
import { useEffect, useMemo, useRef } from 'react';
import { formatMonthYear } from '@/shared/lib/utils/dates';
import type { GraduationReportFilter } from '../_lib/types';
import {
	getAvailableCountriesForGraduations,
	getAvailableSponsorsForGraduations,
	getGraduationDates,
} from '../_server/actions';

const BASE_COLUMNS = [
	{ value: 'stdNo', label: 'Student No.' },
	{ value: 'name', label: 'Name' },
	{ value: 'gender', label: 'Gender' },
	{ value: 'program', label: 'Program' },
	{ value: 'school', label: 'School' },
	{ value: 'graduationDate', label: 'Graduation Date' },
	{ value: 'sponsor', label: 'Sponsor' },
];

const FILTER_COLUMNS = [
	{ value: 'programLevel', label: 'Program Level', filterKey: 'programLevels' },
	{ value: 'country', label: 'Country', filterKey: 'country' },
	{ value: 'age', label: 'Age', filterKey: 'ageRange' },
];

const EXTRA_COLUMNS = [
	{ value: 'email', label: 'Email' },
	{ value: 'phone', label: 'Phone Number' },
	{ value: 'birthDate', label: 'Birth Date' },
	{ value: 'birthPlace', label: 'Birth Place' },
	{ value: 'nationalId', label: 'National ID' },
	{ value: 'address', label: 'Address' },
	{ value: 'intake', label: 'Intake' },
];

export function getDefaultVisibleColumns(): string[] {
	return BASE_COLUMNS.map((col) => col.value);
}

interface Props {
	onFilterChange: (filter: GraduationReportFilter) => void;
}

export default function GraduationFilter({ onFilterChange }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [localFilter, setLocalFilter] = useQueryStates(
		{
			graduationMonth: parseAsString,
			schoolIds: parseAsArrayOf(parseAsInteger),
			programId: parseAsInteger,
			programLevels: parseAsArrayOf(parseAsString),
			gender: parseAsString,
			sponsorId: parseAsInteger,
			ageRangeMin: parseAsInteger.withDefault(0),
			ageRangeMax: parseAsInteger.withDefault(75),
			country: parseAsString,
			visibleColumns: parseAsArrayOf(parseAsString),
		},
		{
			history: 'push',
			shallow: false,
		}
	);

	const hasAgeFilter =
		localFilter.ageRangeMin !== 0 || localFilter.ageRangeMax !== 75;

	const activeFilterColumnKeys = useMemo(() => {
		const activeColumns: string[] = [];
		if (localFilter.programLevels && localFilter.programLevels.length > 0) {
			activeColumns.push('programLevel');
		}
		if (localFilter.country) {
			activeColumns.push('country');
		}
		if (hasAgeFilter) {
			activeColumns.push('age');
		}
		return activeColumns;
	}, [localFilter.programLevels, localFilter.country, hasAgeFilter]);

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
		const newFilter: GraduationReportFilter = {
			graduationMonth: localFilter.graduationMonth ?? undefined,
			schoolIds:
				localFilter.schoolIds && localFilter.schoolIds.length > 0
					? localFilter.schoolIds
					: undefined,
			programId: localFilter.programId ?? undefined,
			programLevels:
				localFilter.programLevels && localFilter.programLevels.length > 0
					? (localFilter.programLevels as ProgramLevel[])
					: undefined,
			gender: localFilter.gender ?? undefined,
			sponsorId: localFilter.sponsorId ?? undefined,
			ageRangeMin:
				localFilter.ageRangeMin !== 0 ? localFilter.ageRangeMin : undefined,
			ageRangeMax:
				localFilter.ageRangeMax !== 75 ? localFilter.ageRangeMax : undefined,
			country: localFilter.country ?? undefined,
		};
		onFilterChange(newFilter);
	}, [localFilter, onFilterChange]);

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
			localFilter.programLevels && localFilter.programLevels.length > 0,
		].filter(Boolean).length || 0;

	const { data: graduationDates = [], isLoading: graduationDatesLoading } =
		useQuery({
			queryKey: ['graduation-dates'],
			queryFn: async () => {
				const result = await getGraduationDates();
				return result.success ? result.data : [];
			},
		});

	const graduationMonthOptions = useMemo(() => {
		const monthsSet = new Set<string>();
		for (const gd of graduationDates) {
			if (gd.date) {
				const month = gd.date.substring(0, 7);
				monthsSet.add(month);
			}
		}
		return Array.from(monthsSet)
			.sort()
			.reverse()
			.map((month) => {
				const [year, monthNum] = month.split('-');
				const date = new Date(Number(year), Number(monthNum) - 1);
				const label = formatMonthYear(date);
				return { value: month, label };
			});
	}, [graduationDates]);

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
		queryKey: ['graduation-report-sponsors'],
		queryFn: async () => {
			const result = await getAvailableSponsorsForGraduations();
			return result.success ? result.data : [];
		},
	});

	const { data: countries = [], isLoading: countriesLoading } = useQuery({
		queryKey: ['graduation-report-countries'],
		queryFn: async () => {
			const result = await getAvailableCountriesForGraduations();
			return result.success && result.data ? result.data : [];
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
			});
			return;
		}

		if (field === 'programLevels') {
			setLocalFilter({
				programLevels: Array.isArray(value) ? (value as string[]) : null,
			});
			return;
		}

		const updates: Record<
			string,
			string | number | string[] | number[] | null
		> = {
			[field]: value as string | number | string[] | number[] | null,
		};

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
						<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
							<Select
								label='Date'
								placeholder='Graduation date'
								data={graduationMonthOptions}
								rightSection={graduationDatesLoading && <Loader size='xs' />}
								value={localFilter.graduationMonth ?? null}
								onChange={(value) => handleChange('graduationMonth', value)}
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

						<Grid.Col span={{ base: 12, sm: 6, md: 5 }}>
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
							min={0}
							max={75}
							step={1}
							marks={[
								{ value: 0, label: '0' },
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

export { BASE_COLUMNS, FILTER_COLUMNS, EXTRA_COLUMNS };
export type { GraduationReportFilter };
