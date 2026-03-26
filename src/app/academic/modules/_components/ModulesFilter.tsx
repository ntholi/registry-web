'use client';

import { getAllSchools } from '@academic/schools/_server/actions';
import { Select } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { useFilterState } from '@/shared/lib/hooks/use-filter-state';
import { FilterButton, FilterModal } from '@/shared/ui/adease';

const statusOptions = [
	{ value: '', label: 'All' },
	{ value: 'Active', label: 'Active' },
	{ value: 'Defunct', label: 'Defunct' },
];

const filterConfig = [{ key: 'schoolId' }, { key: 'status' }];

export default function ModulesFilter() {
	const [opened, { open, close }] = useDisclosure(false);
	const { filters, setFilter, sync, applyFilters, clearFilters, activeCount } =
		useFilterState(filterConfig);

	const { data: schools = [] } = useQuery({
		queryKey: ['schools'],
		queryFn: getAllSchools,
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
				label='Filter Modules'
				activeCount={activeCount}
				opened={opened}
				onClick={handleOpen}
			/>
			<FilterModal
				opened={opened}
				onClose={close}
				title='Filter Modules'
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
					label='Status'
					placeholder='All statuses'
					data={statusOptions}
					value={filters.status || null}
					onChange={(v) => setFilter('status', v)}
					clearable
				/>
			</FilterModal>
		</>
	);
}
