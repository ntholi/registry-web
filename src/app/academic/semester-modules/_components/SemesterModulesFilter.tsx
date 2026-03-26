'use client';

import {
	getAllPrograms,
	getAllSchools,
} from '@academic/schools/_server/actions';
import { Loader, Select } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { useFilterState } from '@/shared/lib/hooks/use-filter-state';
import { FilterButton, FilterModal } from '@/shared/ui/adease';

const filterConfig = [{ key: 'schoolId' }, { key: 'programId' }];

export default function SemesterModulesFilter() {
	const [opened, { open, close }] = useDisclosure(false);
	const { filters, setFilter, sync, applyFilters, clearFilters, activeCount } =
		useFilterState(filterConfig);

	const { data: schools = [] } = useQuery({
		queryKey: ['schools'],
		queryFn: getAllSchools,
		enabled: opened,
	});

	const { data: programs = [], isLoading: programsLoading } = useQuery({
		queryKey: ['all-programs'],
		queryFn: getAllPrograms,
		enabled: opened,
	});

	function handleOpen() {
		sync();
		open();
	}

	function handleApply() {
		applyFilters();
		close();
	}

	function handleClear() {
		clearFilters();
		close();
	}

	return (
		<>
			<FilterButton
				label='Filter Semester Modules'
				activeCount={activeCount}
				opened={opened}
				onClick={handleOpen}
			/>
			<FilterModal
				opened={opened}
				onClose={close}
				title='Filter Semester Modules'
				onApply={handleApply}
				onClear={handleClear}
			>
				<Select
					label='School'
					placeholder='All schools'
					data={schools.map((s: { id: number; name: string }) => ({
						value: s.id.toString(),
						label: s.name,
					}))}
					value={filters.schoolId || null}
					onChange={(v) => setFilter('schoolId', v)}
					searchable
					clearable
				/>
				<Select
					label='Program'
					placeholder='All programs'
					data={programs.map((p) => ({
						value: p.id.toString(),
						label: `${p.code} - ${p.name}`,
					}))}
					rightSection={programsLoading && <Loader size='xs' />}
					value={filters.programId || null}
					onChange={(v) => setFilter('programId', v)}
					searchable
					clearable
				/>
			</FilterModal>
		</>
	);
}
