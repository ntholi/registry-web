'use client';

import {
	getAllPrograms,
	getAllSchools,
} from '@academic/schools/_server/actions';
import { Loader, Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useFilterState } from '@/shared/lib/hooks/use-filter-state';
import { FilterModal } from '@/shared/ui/adease';

const filterConfig = [{ key: 'schoolId' }, { key: 'programId' }];

export default function SemesterModulesFilter() {
	const { filters, setFilter, sync, applyFilters, clearFilters, activeCount } =
		useFilterState(filterConfig);

	return (
		<FilterModal
			label='Filter Semester Modules'
			title='Filter Semester Modules'
			activeCount={activeCount}
			onApply={applyFilters}
			onClear={clearFilters}
			onOpen={sync}
		>
			{(opened) => (
				<SemesterModulesFields
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

function SemesterModulesFields({ opened, filters, setFilter }: FieldsProps) {
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
		</>
	);
}
