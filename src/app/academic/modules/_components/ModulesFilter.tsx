'use client';

import { getAllSchools } from '@academic/schools/_server/actions';
import { Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useFilterState } from '@/shared/lib/hooks/use-filter-state';
import { FilterModal } from '@/shared/ui/adease';

const statusOptions = [
	{ value: '', label: 'All' },
	{ value: 'Active', label: 'Active' },
	{ value: 'Defunct', label: 'Defunct' },
];

const filterConfig = [{ key: 'schoolId' }, { key: 'status' }];

export default function ModulesFilter() {
	const { filters, setFilter, sync, applyFilters, clearFilters, activeCount } =
		useFilterState(filterConfig);

	return (
		<FilterModal
			label='Filter Modules'
			title='Filter Modules'
			activeCount={activeCount}
			onApply={applyFilters}
			onClear={clearFilters}
			onOpen={sync}
		>
			{(opened) => (
				<ModulesFields
					opened={opened}
					filters={filters}
					setFilter={setFilter}
				/>
			)}
		</FilterModal>
	);
}

type FieldsProps = {
	opened: boolean;
	filters: Record<string, string | null>;
	setFilter: (key: string, value: string | null) => void;
};

function ModulesFields({ opened, filters, setFilter }: FieldsProps) {
	const { data: schools = [] } = useQuery({
		queryKey: ['schools'],
		queryFn: getAllSchools,
		enabled: opened,
	});

	return (
		<>
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
		</>
	);
}
