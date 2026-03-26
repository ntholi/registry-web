'use client';

import { Loader, Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useFilterState } from '@/shared/lib/hooks/use-filter-state';
import { FilterModal } from '@/shared/ui/adease';
import { getDistinctTables } from './../_server/actions';

const operationOptions = [
	{ value: '', label: 'All' },
	{ value: 'INSERT', label: 'INSERT' },
	{ value: 'UPDATE', label: 'UPDATE' },
	{ value: 'DELETE', label: 'DELETE' },
];

const filterConfig = [{ key: 'operation' }, { key: 'tableName' }];

export default function AuditLogsFilter() {
	const { filters, setFilter, sync, applyFilters, clearFilters, activeCount } =
		useFilterState(filterConfig);

	return (
		<FilterModal
			label='Filter Audit Logs'
			title='Filter Audit Logs'
			activeCount={activeCount}
			onApply={applyFilters}
			onClear={clearFilters}
			onOpen={sync}
		>
			{(opened) => (
				<AuditLogsFields
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

function AuditLogsFields({ opened, filters, setFilter }: FieldsProps) {
	const { data: tables = [], isLoading: tablesLoading } = useQuery({
		queryKey: ['audit-log-tables'],
		queryFn: getDistinctTables,
		enabled: opened,
	});

	return (
		<>
			<Select
				label='Operation'
				placeholder='All operations'
				data={operationOptions}
				value={filters.operation || null}
				onChange={(v) => setFilter('operation', v)}
				clearable
			/>
			<Select
				label='Table'
				placeholder='All tables'
				data={tables.map((t: string) => ({ value: t, label: t }))}
				rightSection={tablesLoading && <Loader size='xs' />}
				value={filters.tableName || null}
				onChange={(v) => setFilter('tableName', v)}
				searchable
				clearable
			/>
		</>
	);
}
