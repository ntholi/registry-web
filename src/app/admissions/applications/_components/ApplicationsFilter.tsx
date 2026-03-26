'use client';

import {
	applicationStatusEnum,
	paymentStatusEnum,
} from '@admissions/_database';
import { Loader, Select } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useFilterState } from '@/shared/lib/hooks/use-filter-state';
import { FilterButton, FilterModal } from '@/shared/ui/adease';
import { findAllIntakePeriods } from '../../intake-periods/_server/actions';

const statusOptions = applicationStatusEnum.enumValues.map((s) => ({
	value: s,
	label: s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
}));

const paymentOptions = paymentStatusEnum.enumValues.map((s) => ({
	value: s,
	label: s.charAt(0).toUpperCase() + s.slice(1),
}));

const filterConfig = [{ key: 'status' }, { key: 'payment' }, { key: 'intake' }];

export default function ApplicationsFilter() {
	const [opened, { open, close }] = useDisclosure(false);

	const { filters, setFilter, sync, applyFilters, clearFilters, activeCount } =
		useFilterState(filterConfig);

	const { data: intakePeriods, isLoading: intakeLoading } = useQuery({
		queryKey: ['intake-periods', 'list'],
		queryFn: () => findAllIntakePeriods(1, ''),
		enabled: opened,
	});

	const intakeOptions = useMemo(
		() =>
			intakePeriods?.items?.map((ip) => ({
				value: ip.id,
				label: ip.name,
			})) || [],
		[intakePeriods]
	);

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
				label='Filter Applications'
				activeCount={activeCount}
				opened={opened}
				onClick={handleOpen}
			/>
			<FilterModal
				opened={opened}
				onClose={close}
				title='Filter Applications'
				onApply={handleApply}
				onClear={handleClear}
			>
				<Select
					label='Status'
					placeholder='Select status'
					data={statusOptions}
					value={filters.status || null}
					onChange={(value) => setFilter('status', value)}
					clearable
				/>
				<Select
					label='Payment Status'
					placeholder='Select payment status'
					data={paymentOptions}
					value={filters.payment || null}
					onChange={(value) => setFilter('payment', value)}
					clearable
				/>
				<Select
					label='Intake Period'
					placeholder='Select intake'
					data={intakeOptions}
					rightSection={intakeLoading && <Loader size='xs' />}
					value={filters.intake || null}
					onChange={(value) => setFilter('intake', value)}
					searchable
					clearable
				/>
			</FilterModal>
		</>
	);
}
