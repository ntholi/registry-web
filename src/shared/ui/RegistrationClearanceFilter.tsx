'use client';

import { programLevelEnum } from '@academic/_database';
import {
	getAllSchools,
	getProgramsBySchoolId,
} from '@academic/schools/_server/actions';
import {
	ActionIcon,
	Badge,
	Button,
	Group,
	Modal,
	Paper,
	Select,
	Stack,
	Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter, IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { getAllTerms } from '@/app/registry/terms';
import { formatSemester } from '@/shared/lib/utils/utils';
import {
	type ClearanceFilter,
	clearanceFilterAtom,
	defaultClearanceFilter,
} from '@/shared/ui/atoms/clearanceFilterAtoms';

function useActiveTerm(terms: { id: number; isActive: boolean }[]) {
	return terms.find((t) => t.isActive);
}

const semesterOptions = Array.from({ length: 8 }, (_, i) => {
	const num = (i + 1).toString().padStart(2, '0');
	return { value: num, label: formatSemester(num, 'mini') };
});

const levelOptions = programLevelEnum.enumValues.map((level) => ({
	value: level,
	label: level.charAt(0).toUpperCase() + level.slice(1),
}));

interface Props {
	onFilterChange?: (filter: ClearanceFilter) => void;
}

export default function RegistrationClearanceFilter({ onFilterChange }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [filter, setFilter] = useAtom(clearanceFilterAtom);

	const { data: terms = [], isLoading: termsLoading } = useQuery({
		queryKey: ['terms'],
		queryFn: getAllTerms,
		staleTime: 1000 * 60 * 10,
	});

	const activeTerm = useActiveTerm(terms);

	const { data: schools = [], isLoading: schoolsLoading } = useQuery({
		queryKey: ['all-schools'],
		queryFn: getAllSchools,
		staleTime: 1000 * 60 * 10,
	});

	const { data: programs = [], isLoading: programsLoading } = useQuery({
		queryKey: ['programs-by-school', filter.schoolId],
		queryFn: () => getProgramsBySchoolId(filter.schoolId),
		enabled: Boolean(filter.schoolId),
		staleTime: 1000 * 60 * 10,
	});

	const isNonActiveTermSelected =
		filter.termId !== undefined && filter.termId !== activeTerm?.id;

	const activeFiltersCount = [
		isNonActiveTermSelected ? filter.termId : undefined,
		filter.schoolId,
		filter.programId,
		filter.programLevel,
		filter.semester,
	].filter(Boolean).length;

	function handleChange<K extends keyof ClearanceFilter>(
		key: K,
		value: ClearanceFilter[K]
	) {
		const newFilter = { ...filter, [key]: value };

		if (key === 'schoolId') {
			newFilter.programId = undefined;
		}

		setFilter(newFilter);
		onFilterChange?.(newFilter);
	}

	function handleClear() {
		setFilter(defaultClearanceFilter);
		onFilterChange?.(defaultClearanceFilter);
	}

	function handleApply() {
		onFilterChange?.(filter);
		close();
	}

	const isDefaultFilter = activeFiltersCount === 0;

	return (
		<>
			<Tooltip label='Filter clearances'>
				<ActionIcon
					variant={isDefaultFilter ? 'default' : 'filled'}
					color='blue'
					onClick={open}
					size='input-sm'
					pos='relative'
				>
					<IconFilter size={16} />
					{activeFiltersCount > 0 && (
						<Badge
							size='xs'
							circle
							style={{ zIndex: 100 }}
							pos='absolute'
							top={-4}
							right={-4}
							color='red'
						>
							{activeFiltersCount}
						</Badge>
					)}
				</ActionIcon>
			</Tooltip>

			<Modal
				opened={opened}
				onClose={close}
				title='Filter Clearances'
				size='md'
			>
				<Paper p='md' withBorder>
					<Stack gap='md'>
						<Select
							label='Term'
							placeholder='Select term'
							data={terms.map((term) => ({
								value: term.id.toString(),
								label: term.code + (term.isActive ? ' (Current)' : ''),
							}))}
							value={filter.termId?.toString() ?? null}
							onChange={(val) =>
								handleChange('termId', val ? Number(val) : undefined)
							}
							clearable
							searchable
							disabled={termsLoading}
						/>

						<Select
							label='Program Level'
							placeholder='Select level'
							data={levelOptions}
							value={filter.programLevel ?? null}
							onChange={(val) =>
								handleChange(
									'programLevel',
									(val as ClearanceFilter['programLevel']) ?? undefined
								)
							}
							clearable
						/>

						<Select
							label='School'
							placeholder='Select school'
							data={schools.map((s) => ({
								value: s.id.toString(),
								label: s.name,
							}))}
							value={filter.schoolId?.toString() ?? null}
							onChange={(val) =>
								handleChange('schoolId', val ? Number(val) : undefined)
							}
							clearable
							searchable
							disabled={schoolsLoading}
						/>

						<Select
							label='Program'
							placeholder='Select program'
							data={programs.map((p) => ({
								value: p.id.toString(),
								label: `${p.code} - ${p.name}`,
							}))}
							value={filter.programId?.toString() ?? null}
							onChange={(val) =>
								handleChange('programId', val ? Number(val) : undefined)
							}
							clearable
							searchable
							disabled={!filter.schoolId || programsLoading}
						/>

						<Select
							label='Semester'
							placeholder='Select semester'
							data={semesterOptions}
							value={filter.semester ?? null}
							onChange={(val) => handleChange('semester', val ?? undefined)}
							clearable
						/>

						<Group justify='space-between' mt='md'>
							<Button
								variant='subtle'
								color='gray'
								leftSection={<IconX size={16} />}
								onClick={handleClear}
								disabled={isDefaultFilter}
							>
								Clear All
							</Button>
							<Button onClick={handleApply}>Apply Filters</Button>
						</Group>
					</Stack>
				</Paper>
			</Modal>
		</>
	);
}
