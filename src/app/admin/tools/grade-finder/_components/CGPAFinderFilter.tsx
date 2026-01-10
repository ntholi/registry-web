'use client';

import {
	getActiveSchools,
	getProgramsBySchoolId,
} from '@academic/schools/_server/actions';
import {
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
import { useDisclosure } from '@mantine/hooks';
import { getAllTerms } from '@registry/dates/terms/_server/actions';
import { IconFilter, IconSearch, IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export interface CGPAFinderFilterValues {
	minCGPA: number | null;
	maxCGPA: number | null;
	schoolId: number | null;
	programId: number | null;
	termCode: string | null;
}

interface Props {
	onSearch: (filters: CGPAFinderFilterValues) => void;
	isLoading?: boolean;
}

export function CGPAFinderFilter({ onSearch, isLoading }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [minCGPA, setMinCGPA] = useState<number | null>(null);
	const [maxCGPA, setMaxCGPA] = useState<number | null>(null);
	const [schoolId, setSchoolId] = useState<number | null>(null);
	const [programId, setProgramId] = useState<number | null>(null);
	const [termCode, setTermCode] = useState<string | null>(null);

	const { data: schools = [], isLoading: schoolsLoading } = useQuery({
		queryKey: ['active-schools'],
		queryFn: getActiveSchools,
	});

	const { data: programs = [], isLoading: programsLoading } = useQuery({
		queryKey: ['programs-by-school', schoolId],
		queryFn: () => getProgramsBySchoolId(schoolId ?? undefined),
		enabled: !!schoolId,
	});

	const { data: terms = [], isLoading: termsLoading } = useQuery({
		queryKey: ['terms'],
		queryFn: getAllTerms,
	});

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

	const activeFiltersCount = [schoolId, programId, termCode].filter(
		Boolean
	).length;

	const canSearch = minCGPA !== null && maxCGPA !== null && minCGPA <= maxCGPA;

	function handleSearch() {
		onSearch({
			minCGPA,
			maxCGPA,
			schoolId,
			programId,
			termCode,
		});
	}

	function handleClearFilters() {
		setSchoolId(null);
		setProgramId(null);
		setTermCode(null);
	}

	function handleSchoolChange(value: string | null) {
		setSchoolId(value ? Number(value) : null);
		setProgramId(null);
	}

	function handleApplyFilters() {
		close();
	}

	const selectedSchool = schools.find((s) => s.id === schoolId);
	const selectedProgram = programs.find((p) => p.id === programId);

	return (
		<>
			<Paper withBorder p='md'>
				<Stack gap='md'>
					<Group justify='space-between' align='flex-end'>
						<Group gap='sm'>
							<NumberInput
								placeholder='Min CGPA'
								value={minCGPA ?? ''}
								onChange={(value) =>
									setMinCGPA(typeof value === 'number' ? value : null)
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
								value={maxCGPA ?? ''}
								onChange={(value) =>
									setMaxCGPA(typeof value === 'number' ? value : null)
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
							{selectedSchool && (
								<Badge
									variant='light'
									rightSection={
										<IconX
											size={12}
											style={{ cursor: 'pointer' }}
											onClick={() => {
												setSchoolId(null);
												setProgramId(null);
											}}
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
											onClick={() => setProgramId(null)}
										/>
									}
								>
									{selectedProgram.code}
								</Badge>
							)}
							{termCode && (
								<Badge
									variant='light'
									rightSection={
										<IconX
											size={12}
											style={{ cursor: 'pointer' }}
											onClick={() => setTermCode(null)}
										/>
									}
								>
									{termCode}
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
						value={schoolId?.toString() ?? null}
						onChange={handleSchoolChange}
						searchable
						clearable
						rightSection={schoolsLoading ? <Loader size='xs' /> : null}
					/>

					<Select
						label='Program'
						placeholder='All programs'
						data={programOptions}
						value={programId?.toString() ?? null}
						onChange={(value) => setProgramId(value ? Number(value) : null)}
						searchable
						clearable
						disabled={!schoolId}
						rightSection={programsLoading ? <Loader size='xs' /> : null}
					/>

					<Divider label='Academic' labelPosition='left' />

					<Select
						label='Term (student must have enrolled in this term)'
						placeholder='All terms'
						data={termOptions}
						value={termCode}
						onChange={setTermCode}
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
