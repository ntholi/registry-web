'use client';

import type { Grade } from '@academic/_database';
import { grade as gradeEnum } from '@academic/_database/schema/enums';
import {
	getActiveSchools,
	getProgramsBySchoolId,
} from '@academic/schools/_server/actions';
import {
	Autocomplete,
	Badge,
	Button,
	Divider,
	Group,
	Loader,
	Modal,
	NumberInput,
	Paper,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { IconFilter, IconSearch, IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import {
	parseAsFloat,
	parseAsInteger,
	parseAsString,
	useQueryStates,
} from 'nuqs';
import { useState } from 'react';
import { getAllTerms } from '@/app/registry/terms/_server/actions';
import { formatSemester } from '@/shared/lib/utils/utils';
import { searchModulesForGradeFinder } from '../_server/actions';
import type { SearchMode } from '../_server/repository';

const semesterOptions = Array.from({ length: 8 }, (_, i) => {
	const num = (i + 1).toString();
	return {
		value: num,
		label: formatSemester(num, 'short'),
	};
});

export interface GradeFinderFilterValues {
	mode: SearchMode;
	grade: Grade | null;
	minPoints: number | null;
	maxPoints: number | null;
	schoolId: number | null;
	programId: number | null;
	semesterNumber: string | null;
	termCode: string | null;
	moduleId: number | null;
}

interface Props {
	mode: SearchMode;
	onSearch: (filters: GradeFinderFilterValues) => void;
	isLoading?: boolean;
}

export function GradeFinderFilter({ mode, onSearch, isLoading }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [params, setParams] = useQueryStates({
		grade: parseAsString,
		minPoints: parseAsFloat,
		maxPoints: parseAsFloat,
		schoolId: parseAsInteger,
		programId: parseAsInteger,
		semesterNumber: parseAsString,
		termCode: parseAsString,
		moduleId: parseAsInteger,
	});
	const [moduleSearch, setModuleSearch] = useState('');
	const [debouncedModuleSearch] = useDebouncedValue(moduleSearch, 300);

	const { data: schools = [], isLoading: schoolsLoading } = useQuery({
		queryKey: ['active-schools'],
		queryFn: getActiveSchools,
	});

	const { data: programs = [], isLoading: programsLoading } = useQuery({
		queryKey: ['programs-by-school', params.schoolId],
		queryFn: () => getProgramsBySchoolId(params.schoolId ?? undefined),
		enabled: !!params.schoolId,
	});

	const { data: terms = [], isLoading: termsLoading } = useQuery({
		queryKey: ['terms'],
		queryFn: getAllTerms,
	});

	const { data: moduleOptions = [], isLoading: modulesLoading } = useQuery({
		queryKey: ['grade-finder-modules', debouncedModuleSearch],
		queryFn: () => searchModulesForGradeFinder(debouncedModuleSearch),
		enabled: debouncedModuleSearch.length >= 2,
	});

	const gradeOptions = gradeEnum.enumValues.map((g) => ({
		value: g,
		label: g,
	}));

	const schoolOptions = schools.map((s) => ({
		value: s.id.toString(),
		label: `${s.code} - ${s.name}`,
	}));

	const programOptions = programs.map((p) => ({
		value: p.id.toString(),
		label: `${p.code} - ${p.name}`,
	}));

	const termOptions = terms.map((t) => ({
		value: t.code,
		label: t.code,
	}));

	const moduleAutocompleteOptions = moduleOptions.map((m) => ({
		value: m.id.toString(),
		label: `${m.code} - ${m.name}`,
	}));

	const activeFiltersCount = [
		params.schoolId,
		params.programId,
		params.semesterNumber,
		params.termCode,
		params.moduleId,
	].filter(Boolean).length;

	const canSearch =
		mode === 'grade'
			? !!params.grade
			: params.minPoints !== null &&
				params.maxPoints !== null &&
				params.minPoints <= params.maxPoints;

	function handleSearch() {
		onSearch({
			mode,
			grade: params.grade as Grade | null,
			minPoints: params.minPoints,
			maxPoints: params.maxPoints,
			schoolId: params.schoolId,
			programId: params.programId,
			semesterNumber: params.semesterNumber,
			termCode: params.termCode,
			moduleId: params.moduleId,
		});
	}

	function handleClearFilters() {
		setParams({
			schoolId: null,
			programId: null,
			semesterNumber: null,
			termCode: null,
			moduleId: null,
		});
		setModuleSearch('');
	}

	function handleSchoolChange(value: string | null) {
		setParams({
			schoolId: value ? Number(value) : null,
			programId: null,
		});
	}

	function handleModuleSelect(value: string) {
		const selected = moduleOptions.find((m) => m.id.toString() === value);
		if (selected) {
			setParams({ moduleId: selected.id });
			setModuleSearch(`${selected.code} - ${selected.name}`);
		}
	}

	function handleApplyFilters() {
		close();
	}

	const selectedSchool = schools.find((s) => s.id === params.schoolId);
	const selectedProgram = programs.find((p) => p.id === params.programId);
	const selectedModule = moduleOptions.find((m) => m.id === params.moduleId);

	return (
		<>
			<Paper withBorder p='md'>
				<Stack gap='md'>
					<Group justify='space-between' align='flex-end'>
						<Group gap='sm'>
							{mode === 'grade' ? (
								<Select
									placeholder='Select grade'
									data={gradeOptions}
									value={params.grade}
									onChange={(value) => setParams({ grade: value })}
									searchable
									clearable
									w={300}
								/>
							) : (
								<>
									<NumberInput
										placeholder='Min'
										value={params.minPoints ?? ''}
										onChange={(value) =>
											setParams({
												minPoints: typeof value === 'number' ? value : null,
											})
										}
										min={0}
										max={4}
										step={0.1}
										decimalScale={2}
										w={200}
									/>
									<NumberInput
										placeholder='Max'
										value={params.maxPoints ?? ''}
										onChange={(value) =>
											setParams({
												maxPoints: typeof value === 'number' ? value : null,
											})
										}
										min={0}
										max={4}
										step={0.1}
										decimalScale={2}
										w={200}
									/>
								</>
							)}
						</Group>
						<Group gap='sm'>
							<Button
								variant='light'
								leftSection={<IconFilter size={16} />}
								onClick={open}
								rightSection={
									activeFiltersCount > 0 ? (
										<Badge size='xs' circle>
											{activeFiltersCount}
										</Badge>
									) : null
								}
							>
								Filters
							</Button>
							<Button
								leftSection={<IconSearch size={16} />}
								onClick={handleSearch}
								loading={isLoading}
								disabled={!canSearch}
							>
								Search
							</Button>
						</Group>
					</Group>

					{activeFiltersCount > 0 && (
						<Group gap='xs'>
							<Text size='sm' c='dimmed'>
								Active filters:
							</Text>
							{selectedSchool && (
								<Badge
									variant='light'
									rightSection={
										<IconX
											size={12}
											style={{ cursor: 'pointer' }}
											onClick={() =>
												setParams({ schoolId: null, programId: null })
											}
										/>
									}
								>
									{selectedSchool.code}
								</Badge>
							)}
							{selectedProgram && (
								<Badge
									variant='light'
									rightSection={
										<IconX
											size={12}
											style={{ cursor: 'pointer' }}
											onClick={() => setParams({ programId: null })}
										/>
									}
								>
									{selectedProgram.code}
								</Badge>
							)}
							{params.semesterNumber && (
								<Badge
									variant='light'
									rightSection={
										<IconX
											size={12}
											style={{ cursor: 'pointer' }}
											onClick={() => setParams({ semesterNumber: null })}
										/>
									}
								>
									{formatSemester(params.semesterNumber, 'mini')}
								</Badge>
							)}
							{params.termCode && (
								<Badge
									variant='light'
									rightSection={
										<IconX
											size={12}
											style={{ cursor: 'pointer' }}
											onClick={() => setParams({ termCode: null })}
										/>
									}
								>
									{params.termCode}
								</Badge>
							)}
							{selectedModule && (
								<Badge
									variant='light'
									rightSection={
										<IconX
											size={12}
											style={{ cursor: 'pointer' }}
											onClick={() => {
												setParams({ moduleId: null });
												setModuleSearch('');
											}}
										/>
									}
								>
									{selectedModule.code}
								</Badge>
							)}
							<Button
								variant='subtle'
								size='xs'
								color='gray'
								onClick={handleClearFilters}
							>
								Clear all
							</Button>
						</Group>
					)}
				</Stack>
			</Paper>

			<Modal
				opened={opened}
				onClose={close}
				title='Additional Filters'
				size='lg'
			>
				<Stack gap='md'>
					<Divider label='Location' labelPosition='left' />

					<Select
						label='School'
						placeholder='All schools'
						data={schoolOptions}
						value={params.schoolId?.toString() ?? null}
						onChange={handleSchoolChange}
						searchable
						clearable
						rightSection={schoolsLoading ? <Loader size='xs' /> : null}
					/>

					<Select
						label='Program'
						placeholder='All programs'
						data={programOptions}
						value={params.programId?.toString() ?? null}
						onChange={(value) =>
							setParams({ programId: value ? Number(value) : null })
						}
						searchable
						clearable
						disabled={!params.schoolId}
						rightSection={programsLoading ? <Loader size='xs' /> : null}
					/>

					<Divider label='Academic' labelPosition='left' />

					<Group grow>
						<Select
							label='Semester'
							placeholder='All semesters'
							data={semesterOptions}
							value={params.semesterNumber}
							onChange={(value) => setParams({ semesterNumber: value })}
							clearable
						/>

						<Select
							label='Term'
							placeholder='All terms'
							data={termOptions}
							value={params.termCode}
							onChange={(value) => setParams({ termCode: value })}
							searchable
							clearable
							rightSection={termsLoading ? <Loader size='xs' /> : null}
						/>
					</Group>

					<Divider label='Module' labelPosition='left' />

					<Autocomplete
						label='Module'
						placeholder='Search by code or name'
						value={moduleSearch}
						onChange={(value) => {
							setModuleSearch(value);
							if (!value) setParams({ moduleId: null });
						}}
						onOptionSubmit={handleModuleSelect}
						data={moduleAutocompleteOptions}
						rightSection={modulesLoading ? <Loader size='xs' /> : null}
					/>

					<Divider />

					<Group justify='flex-end'>
						<Button variant='subtle' onClick={handleClearFilters}>
							Clear Filters
						</Button>
						<Button onClick={handleApplyFilters}>Apply</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
