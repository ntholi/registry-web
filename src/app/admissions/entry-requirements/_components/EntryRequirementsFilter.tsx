'use client';

import type { ProgramLevel } from '@academic/_database';
import { getAllSchools } from '@academic/schools';
import { Loader, Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useFilterState } from '@/shared/lib/hooks/use-filter-state';
import { FilterModal } from '@/shared/ui/adease';

const levelOptions: { value: ProgramLevel; label: string }[] = [
	{ value: 'certificate', label: 'Certificate' },
	{ value: 'diploma', label: 'Diploma' },
	{ value: 'degree', label: 'Degree' },
];

const filterConfig = [{ key: 'schoolId' }, { key: 'level' }];

export default function EntryRequirementsFilter() {
	const { filters, setFilter, sync, applyFilters, clearFilters, activeCount } =
		useFilterState(filterConfig);

	return (
		<FilterModal
			label='Filter Requirements'
			title='Filter Entry Requirements'
			activeCount={activeCount}
			onApply={applyFilters}
			onClear={clearFilters}
			onOpen={sync}
		>
			{(opened) => (
				<EntryRequirementsFields
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

function EntryRequirementsFields({ opened, filters, setFilter }: FieldsProps) {
	const { data: schools = [], isLoading: schoolLoading } = useQuery({
		queryKey: ['schools'],
		queryFn: getAllSchools,
		enabled: opened,
	});

	return (
		<>
			<Select
				label='School'
				placeholder='Select school'
				data={schools.map((school: { id: number; name: string }) => ({
					value: school.id?.toString() || '',
					label: school.name,
				}))}
				rightSection={schoolLoading && <Loader size='xs' />}
				value={filters.schoolId || null}
				onChange={(value) => setFilter('schoolId', value)}
				searchable
				clearable
			/>
			<Select
				label='Program Level'
				placeholder='Select level'
				data={levelOptions}
				value={filters.level || null}
				onChange={(value) => setFilter('level', value)}
				clearable
			/>
		</>
	);
}
