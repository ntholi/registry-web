'use client';

import type { ProgramLevel } from '@academic/_database';
import { getAllSchools } from '@academic/schools';
import { Loader, Select } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { useFilterState } from '@/shared/lib/hooks/use-filter-state';
import { FilterButton, FilterModal } from '@/shared/ui/adease';

const levelOptions: { value: ProgramLevel; label: string }[] = [
	{ value: 'certificate', label: 'Certificate' },
	{ value: 'diploma', label: 'Diploma' },
	{ value: 'degree', label: 'Degree' },
];

const filterConfig = [{ key: 'schoolId' }, { key: 'level' }];

export default function EntryRequirementsFilter() {
	const [opened, { open, close }] = useDisclosure(false);

	const { filters, setFilter, sync, applyFilters, clearFilters, activeCount } =
		useFilterState(filterConfig);

	const { data: schools = [], isLoading: schoolLoading } = useQuery({
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
				label='Filter Requirements'
				activeCount={activeCount}
				opened={opened}
				onClick={handleOpen}
			/>
			<FilterModal
				opened={opened}
				onClose={close}
				title='Filter Entry Requirements'
				onApply={handleApply}
				onClear={handleClear}
			>
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
			</FilterModal>
		</>
	);
}
