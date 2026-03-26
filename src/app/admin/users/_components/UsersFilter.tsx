'use client';

import { findPresetsByRole } from '@auth/permission-presets/_server/actions';
import { Select } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { DASHBOARD_ROLES } from '@/core/auth/permissions';
import { useFilterState } from '@/shared/lib/hooks/use-filter-state';
import { toTitleCase } from '@/shared/lib/utils/utils';
import { FilterButton, FilterModal } from '@/shared/ui/adease';

const roleOptions = [
	{ value: '', label: 'All Roles' },
	...DASHBOARD_ROLES.map((role) => ({
		value: role,
		label: toTitleCase(role),
	})),
];

const filterConfig = [{ key: 'role' }, { key: 'presetId' }];

export default function UsersFilter() {
	const [opened, { open, close }] = useDisclosure(false);
	const { filters, setFilter, sync, applyFilters, clearFilters, activeCount } =
		useFilterState(filterConfig);

	const { data: presets = [] } = useQuery({
		queryKey: ['presets-by-role', filters.role],
		queryFn: () => findPresetsByRole(filters.role!),
		enabled: !!filters.role,
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
				label='Filter Users'
				activeCount={activeCount}
				opened={opened}
				onClick={handleOpen}
			/>
			<FilterModal
				opened={opened}
				onClose={close}
				title='Filter Users'
				onApply={handleApply}
				onClear={handleClear}
			>
				<Select
					label='Role'
					placeholder='All roles'
					data={roleOptions}
					value={filters.role || null}
					onChange={(v) => {
						setFilter('role', v);
						setFilter('presetId', null);
					}}
					searchable
					clearable
				/>
				<Select
					label='Permission Preset'
					placeholder='All presets'
					data={presets.map((p) => ({
						value: p.id,
						label: p.name,
					}))}
					value={filters.presetId || null}
					onChange={(v) => setFilter('presetId', v)}
					searchable
					clearable
					disabled={!filters.role}
				/>
			</FilterModal>
		</>
	);
}
