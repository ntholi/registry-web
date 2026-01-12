'use client';

import {
	getActiveSchools,
	getProgramsBySchoolIds,
} from '@academic/schools/_server/actions';
import {
	Badge,
	Button,
	Divider,
	Group,
	Loader,
	Modal,
	MultiSelect,
	NumberInput,
	Paper,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { getAllTerms } from '@registry/dates/terms/_server/actions';
import { IconFilter, IconSearch, IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import {
	parseAsArrayOf,
	parseAsFloat,
	parseAsInteger,
	parseAsString,
	useQueryStates,
} from 'nuqs';
import { useEffect, useRef } from 'react';
import { useUserSchools } from '@/shared/lib/hooks/use-user-schools';

export interface CGPAFinderFilterValues {
	minCGPA: number | null;
	maxCGPA: number | null;
	schoolIds: number[] | null;
	programId: number | null;
	termCode: string | null;
}

interface Props {
	onSearch: (filters: CGPAFinderFilterValues) => void;
	isLoading?: boolean;
}

export function CGPAFinderFilter({ onSearch, isLoading }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const { userSchools } = useUserSchools();
	const termAutoSelected = useRef(false);
	const schoolsAutoSelected = useRef(false);

	const [params, setParams] = useQueryStates({
		minCGPA: parseAsFloat,
		maxCGPA: parseAsFloat,
		schoolIds: parseAsArrayOf(parseAsInteger),
		programId: parseAsInteger,
		termCode: parseAsString,
	});

	const { data: schools = [], isLoading: schoolsLoading } = useQuery({
		queryKey: ['active-schools'],
		queryFn: getActiveSchools,
	});

	const { data: programs = [], isLoading: programsLoading } = useQuery({
		queryKey: ['programs-by-school-ids', params.schoolIds],
		queryFn: () => getProgramsBySchoolIds(params.schoolIds ?? undefined),
		enabled: (params.schoolIds?.length ?? 0) > 0,
	});

	const { data: terms = [], isLoading: termsLoading } = useQuery({
		queryKey: ['terms'],
		queryFn: getAllTerms,
	});

	useEffect(() => {
		if (!termAutoSelected.current && !params.termCode && terms.length > 0) {
			const activeTerm = terms.find((term) => term.isActive);
			if (activeTerm) {
				setParams({ termCode: activeTerm.code });
				termAutoSelected.current = true;
			}
		}
	}, [terms, params.termCode, setParams]);

	useEffect(() => {
		if (
			!schoolsAutoSelected.current &&
			(!params.schoolIds || params.schoolIds.length === 0) &&
			userSchools.length > 0 &&
			schools.length > 0
		) {
			const userSchoolIds = userSchools.map((us) => us.schoolId);
			const validSchoolIds = userSchoolIds.filter((id) =>
				schools.some((s) => s.id === id)
			);
			if (validSchoolIds.length > 0) {
				setParams({ schoolIds: validSchoolIds });
				schoolsAutoSelected.current = true;
			}
		}
	}, [userSchools, schools, params.schoolIds, setParams]);

	const schoolOptions = schools.map((s) => ({
		value: s.id.toString(),
		label: s.code,
		description: s.name,
	}));

	const programOptions = programs.map((p) => ({
		value: p.id.toString(),
		label: p.code,
		description: p.name,
	}));

	const termOptions = terms.map((t) => ({
		value: t.code,
		label: t.code,
	}));

	const activeFiltersCount = [
		params.schoolIds && params.schoolIds.length > 0 ? 1 : 0,
		params.programId,
		params.termCode,
	].filter(Boolean).length;

	const canSearch =
		params.minCGPA !== null &&
		params.maxCGPA !== null &&
		params.minCGPA <= params.maxCGPA;

	function handleSearch() {
		onSearch({
			minCGPA: params.minCGPA,
			maxCGPA: params.maxCGPA,
			schoolIds: params.schoolIds,
			programId: params.programId,
			termCode: params.termCode,
		});
	}

	function handleClearFilters() {
		setParams({
			schoolIds: null,
			programId: null,
			termCode: null,
		});
	}

	function handleSchoolsChange(values: string[]) {
		setParams({
			schoolIds: values.length > 0 ? values.map(Number) : null,
			programId: null,
		});
	}

	function handleApplyFilters() {
		close();
	}

	const selectedSchools = schools.filter((s) =>
		params.schoolIds?.includes(s.id)
	);
	const selectedProgram = programs.find((p) => p.id === params.programId);

	return (
		<>
			<Paper withBorder p='md'>
				<Stack gap='md'>
					<Group justify='space-between' align='flex-end'>
						<Group gap='sm'>
							<NumberInput
								placeholder='Min CGPA'
								value={params.minCGPA ?? ''}
								onChange={(value) =>
									setParams({
										minCGPA: typeof value === 'number' ? value : null,
									})
								}
								min={0}
								max={4}
								step={0.1}
								decimalScale={2}
								w={150}
							/>
							<Text c='dimmed'>to</Text>
							<NumberInput
								placeholder='Max CGPA'
								value={params.maxCGPA ?? ''}
								onChange={(value) =>
									setParams({
										maxCGPA: typeof value === 'number' ? value : null,
									})
								}
								min={0}
								max={4}
								step={0.1}
								decimalScale={2}
								w={150}
							/>
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
							{selectedSchools.map((school) => (
								<Badge
									key={school.id}
									variant='light'
									rightSection={
										<IconX
											size={12}
											style={{ cursor: 'pointer' }}
											onClick={() =>
												setParams({
													schoolIds:
														params.schoolIds?.filter(
															(id) => id !== school.id
														) ?? null,
													programId: null,
												})
											}
										/>
									}
								>
									{school.code}
								</Badge>
							))}
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
					<MultiSelect
						label='Schools'
						placeholder='All schools'
						data={schoolOptions}
						value={params.schoolIds?.map(String) ?? []}
						onChange={handleSchoolsChange}
						searchable
						clearable
						rightSection={schoolsLoading ? <Loader size='xs' /> : null}
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
						data={programOptions}
						value={params.programId?.toString() ?? null}
						onChange={(value) =>
							setParams({ programId: value ? Number(value) : null })
						}
						searchable
						clearable
						disabled={!params.schoolIds || params.schoolIds.length === 0}
						rightSection={programsLoading ? <Loader size='xs' /> : null}
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

					<Divider label='Academic' labelPosition='left' />

					<Select
						label='Term (student must have enrolled in this term)'
						placeholder='All terms'
						data={termOptions}
						value={params.termCode}
						onChange={(value) => setParams({ termCode: value })}
						searchable
						clearable
						rightSection={termsLoading ? <Loader size='xs' /> : null}
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
