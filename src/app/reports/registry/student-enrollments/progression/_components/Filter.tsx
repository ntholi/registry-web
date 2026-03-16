'use client';

import { type ProgramLevel, programLevelEnum } from '@academic/_database';
import {
	getActiveSchools,
	getProgramsBySchoolIds,
} from '@academic/schools/_server/actions';
import {
	Badge,
	Button,
	Flex,
	Grid,
	Group,
	Loader,
	Modal,
	MultiSelect,
	Paper,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconAdjustments, IconFilter } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useEffect, useMemo } from 'react';
import { unwrap } from '@/shared/lib/actions/actionResult';
import { useActiveTerm, useAllTerms } from '@/shared/lib/hooks/use-term';
import type {
	ProgressionCategory,
	ProgressionFilter,
} from '../_server/repository';

interface Props {
	onFilterChange: (
		filter: ProgressionFilter & { prevTermId?: number; currTermId?: number }
	) => void;
}

export default function Filter({ onFilterChange }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const { activeTerm } = useActiveTerm();
	const { data: terms = [], isLoading: termsLoading } = useAllTerms();

	const defaultPrevTermId = useMemo(() => {
		if (!activeTerm || terms.length < 2) return undefined;
		const sorted = [...terms].sort((a, b) => b.code.localeCompare(a.code));
		const activeIdx = sorted.findIndex((t) => t.id === activeTerm.id);
		if (activeIdx >= 0 && activeIdx + 1 < sorted.length) {
			return sorted[activeIdx + 1].id;
		}
		return undefined;
	}, [activeTerm, terms]);

	const [localFilter, setLocalFilter] = useQueryStates(
		{
			prevTermId: parseAsInteger,
			currTermId: parseAsInteger,
			schoolIds: parseAsString,
			programId: parseAsInteger,
			programLevels: parseAsString,
			gender: parseAsString,
			sponsorId: parseAsInteger,
			country: parseAsString,
			category: parseAsString,
		},
		{ history: 'push', shallow: false }
	);

	useEffect(() => {
		if (activeTerm && !localFilter.currTermId) {
			setLocalFilter({ currTermId: activeTerm.id });
		}
	}, [activeTerm, localFilter.currTermId, setLocalFilter]);

	useEffect(() => {
		if (defaultPrevTermId && !localFilter.prevTermId) {
			setLocalFilter({ prevTermId: defaultPrevTermId });
		}
	}, [defaultPrevTermId, localFilter.prevTermId, setLocalFilter]);

	const schoolIds = useMemo(() => {
		if (!localFilter.schoolIds) return [];
		return localFilter.schoolIds.split(',').map(Number).filter(Boolean);
	}, [localFilter.schoolIds]);

	const programLevels = useMemo(() => {
		if (!localFilter.programLevels) return [];
		return localFilter.programLevels.split(',');
	}, [localFilter.programLevels]);

	useEffect(() => {
		const newFilter: ProgressionFilter & {
			prevTermId?: number;
			currTermId?: number;
		} = {
			prevTermId: localFilter.prevTermId ?? undefined,
			currTermId: localFilter.currTermId ?? undefined,
			schoolIds: schoolIds.length > 0 ? schoolIds : undefined,
			programId: localFilter.programId ?? undefined,
			programLevels:
				programLevels.length > 0
					? (programLevels as ProgramLevel[])
					: undefined,
			gender: localFilter.gender ?? undefined,
			sponsorId: localFilter.sponsorId ?? undefined,
			country: localFilter.country ?? undefined,
			category: (localFilter.category as ProgressionCategory) ?? undefined,
		};
		onFilterChange(newFilter);
	}, [localFilter, onFilterChange, schoolIds, programLevels]);

	const { data: schools = [], isLoading: schoolsLoading } = useQuery({
		queryKey: ['active-schools'],
		queryFn: getActiveSchools,
		select: unwrap,
	});

	const { data: programsList = [], isLoading: programsLoading } = useQuery({
		queryKey: ['programs-by-school', schoolIds],
		queryFn: () =>
			getProgramsBySchoolIds(schoolIds.length > 0 ? schoolIds : undefined),
		select: unwrap,
		enabled: schoolIds.length > 0,
	});

	const activeFiltersCount =
		[
			localFilter.gender,
			localFilter.sponsorId,
			localFilter.country,
			programLevels.length > 0,
			localFilter.category,
		].filter(Boolean).length || 0;

	const categories: ProgressionCategory[] = [
		'Progressed',
		'Remained',
		'Not Enrolled',
		'Graduated',
		'Dropped Out',
		'Deferred',
		'Terminated/Suspended',
	];

	return (
		<>
			<Paper withBorder p='lg'>
				<Group mb='md'>
					<IconFilter size={18} />
					<Text fw={600}>Filters</Text>
				</Group>

				<Flex align='flex-end' gap='sm'>
					<Grid gutter='md' flex={1}>
						<Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
							<Select
								label='Previous Term'
								placeholder='Select term'
								data={terms.map((t) => ({
									value: t.id?.toString() ?? '',
									label: t.code,
								}))}
								rightSection={termsLoading && <Loader size='xs' />}
								value={localFilter.prevTermId?.toString() ?? null}
								onChange={(v) =>
									setLocalFilter({ prevTermId: v ? Number(v) : null })
								}
								searchable
								clearable
								withAsterisk
							/>
						</Grid.Col>

						<Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
							<Select
								label='Current Term'
								placeholder='Select term'
								data={terms.map((t) => ({
									value: t.id?.toString() ?? '',
									label: t.code,
								}))}
								rightSection={termsLoading && <Loader size='xs' />}
								value={localFilter.currTermId?.toString() ?? null}
								onChange={(v) =>
									setLocalFilter({ currTermId: v ? Number(v) : null })
								}
								searchable
								clearable
								withAsterisk
							/>
						</Grid.Col>

						<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
							<MultiSelect
								label='Schools'
								placeholder='All schools'
								data={schools.map((s) => ({
									value: s.id?.toString() ?? '',
									label: s.code,
									description: s.name,
								}))}
								rightSection={schoolsLoading && <Loader size='xs' />}
								value={schoolIds.map(String)}
								onChange={(vals) =>
									setLocalFilter({
										schoolIds: vals.length > 0 ? vals.join(',') : null,
										programId: null,
									})
								}
								searchable
								clearable
								renderOption={({ option }) => {
									const opt = option as {
										value: string;
										label: string;
										description: string;
									};
									return (
										<div>
											<Text>{opt.label}</Text>
											<Text size='xs' c='dimmed'>
												{opt.description}
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
								data={programsList.map((p) => ({
									value: p.id?.toString() ?? '',
									label: p.code,
									description: p.name,
								}))}
								rightSection={programsLoading && <Loader size='xs' />}
								value={localFilter.programId?.toString() ?? null}
								onChange={(v) =>
									setLocalFilter({ programId: v ? Number(v) : null })
								}
								searchable
								clearable
								disabled={schoolIds.length === 0}
								renderOption={({ option }) => {
									const opt = option as {
										value: string;
										label: string;
										description: string;
									};
									return (
										<div>
											<Text>{opt.label}</Text>
											<Text size='xs' c='dimmed'>
												{opt.description}
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
				size='md'
			>
				<Stack gap='md'>
					<MultiSelect
						label='Program Level'
						placeholder='All levels'
						data={programLevelEnum.enumValues.map((level) => ({
							value: level,
							label: level.charAt(0).toUpperCase() + level.slice(1),
						}))}
						value={programLevels}
						onChange={(vals) =>
							setLocalFilter({
								programLevels: vals.length > 0 ? vals.join(',') : null,
							})
						}
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
						onChange={(v) => setLocalFilter({ gender: v })}
						clearable
					/>

					<Select
						label='Country'
						placeholder='All countries'
						data={[]}
						value={localFilter.country ?? null}
						onChange={(v) => setLocalFilter({ country: v })}
						searchable
						clearable
					/>

					<Select
						label='Category'
						placeholder='All categories'
						data={categories.map((c) => ({ value: c, label: c }))}
						value={localFilter.category ?? null}
						onChange={(v) => setLocalFilter({ category: v })}
						clearable
					/>
				</Stack>
			</Modal>
		</>
	);
}
