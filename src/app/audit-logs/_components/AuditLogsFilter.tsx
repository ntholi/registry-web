'use client';

import { Loader, Select } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { useFilterState } from '@/shared/lib/hooks/use-filter-state';
import { FilterButton, FilterModal } from '@/shared/ui/adease';
import { getDistinctTables } from './../_server/actions';

const operationOptions = [
	{ value: '', label: 'All' },
	{ value: 'INSERT', label: 'INSERT' },
	{ value: 'UPDATE', label: 'UPDATE' },
	{ value: 'DELETE', label: 'DELETE' },
];

const filterConfig = [{ key: 'operation' }, { key: 'tableName' }];

export default function AuditLogsFilter() {
	const [opened, { open, close }] = useDisclosure(false);
	const { filters, setFilter, sync, applyFilters, clearFilters, activeCount } =
		useFilterState(filterConfig);

	const { data: tables = [], isLoading: tablesLoading } = useQuery({
		queryKey: ['audit-log-tables'],
		queryFn: getDistinctTables,
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
				label='Filter Audit Logs'
				activeCount={activeCount}
				opened={opened}
				onClick={handleOpen}
			/>
			<FilterModal
				opened={opened}
				onClose={close}
				title='Filter Audit Logs'
				onApply={handleApply}
				onClear={handleClear}
			>
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
			</FilterModal>
		</>
	);
}
