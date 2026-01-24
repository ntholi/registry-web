'use client';

import {
	applicationStatusEnum,
	paymentStatusEnum,
} from '@admissions/_database';
import {
	ActionIcon,
	Button,
	Group,
	HoverCard,
	Loader,
	Modal,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useQueryState } from 'nuqs';
import { useEffect, useMemo, useState } from 'react';
import { getBooleanColor } from '@/shared/lib/utils/colors';
import { findAllIntakePeriods } from '../../intake-periods/_server/actions';
import type { ApplicationStatus, PaymentStatus } from '../_lib/types';

const statusOptions = [
	{ value: '', label: 'All Statuses' },
	...applicationStatusEnum.enumValues.map((s) => ({
		value: s,
		label: s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
	})),
];

const paymentOptions = [
	{ value: '', label: 'All Payments' },
	...paymentStatusEnum.enumValues.map((s) => ({
		value: s,
		label: s.charAt(0).toUpperCase() + s.slice(1),
	})),
];

export default function ApplicationsFilter() {
	const [opened, { toggle, close }] = useDisclosure(false);

	const [status, setStatus] = useQueryState('status');
	const [payment, setPayment] = useQueryState('payment');
	const [intake, setIntake] = useQueryState('intake');

	const [filters, setFilters] = useState({
		status: status || '',
		payment: payment || '',
		intake: intake || '',
	});

	useEffect(() => {
		setFilters({
			status: status || '',
			payment: payment || '',
			intake: intake || '',
		});
	}, [status, payment, intake]);

	const { data: intakePeriods, isLoading: intakeLoading } = useQuery({
		queryKey: ['intake-periods', 'list'],
		queryFn: () => findAllIntakePeriods(1, ''),
		enabled: opened,
	});

	const intakeOptions = useMemo(
		() => [
			{ value: '', label: 'All Intakes' },
			...(intakePeriods?.items?.map((ip) => ({
				value: ip.id,
				label: ip.name,
			})) || []),
		],
		[intakePeriods]
	);

	const description = useMemo(() => {
		const selectedStatus = statusOptions.find(
			(s) => s.value === filters.status
		);
		const selectedPayment = paymentOptions.find(
			(p) => p.value === filters.payment
		);
		const selectedIntake = intakeOptions.find(
			(i) => i.value === filters.intake
		);

		const parts: string[] = [];
		if (selectedStatus && filters.status) parts.push(selectedStatus.label);
		if (selectedPayment && filters.payment) parts.push(selectedPayment.label);
		if (selectedIntake && filters.intake) parts.push(selectedIntake.label);

		return parts.length > 0 ? parts.join(' • ') : 'All applications';
	}, [filters, intakeOptions]);

	function handleApplyFilters() {
		setStatus(filters.status || null);
		setPayment(filters.payment || null);
		setIntake(filters.intake || null);
		close();
	}

	function handleClearFilters() {
		setFilters({ status: '', payment: '', intake: '' });
		setStatus(null);
		setPayment(null);
		setIntake(null);
		close();
	}

	const hasActiveFilters = status || payment || intake;

	return (
		<>
			<HoverCard withArrow position='top'>
				<HoverCard.Target>
					<ActionIcon
						variant={hasActiveFilters ? 'white' : 'default'}
						size={33}
						onClick={toggle}
						color={getBooleanColor(!!hasActiveFilters, 'highlight')}
					>
						<IconFilter size='1rem' />
					</ActionIcon>
				</HoverCard.Target>
				<HoverCard.Dropdown>
					<Text size='xs'>Filter Applications</Text>
				</HoverCard.Dropdown>
			</HoverCard>

			<Modal
				opened={opened}
				onClose={close}
				title='Filter Applications'
				size='sm'
			>
				<Stack gap='md'>
					<Select
						label='Status'
						placeholder='Select status'
						data={statusOptions.filter((s) => s.value !== '')}
						value={filters.status || null}
						onChange={(value) =>
							setFilters((prev) => ({
								...prev,
								status: (value || '') as ApplicationStatus,
							}))
						}
						clearable
					/>

					<Select
						label='Payment Status'
						placeholder='Select payment status'
						data={paymentOptions.filter((p) => p.value !== '')}
						value={filters.payment || null}
						onChange={(value) =>
							setFilters((prev) => ({
								...prev,
								payment: (value || '') as PaymentStatus,
							}))
						}
						clearable
					/>

					<Select
						label='Intake Period'
						placeholder='Select intake'
						data={intakeOptions.filter((i) => i.value !== '')}
						rightSection={intakeLoading && <Loader size='xs' />}
						value={filters.intake || null}
						onChange={(value) =>
							setFilters((prev) => ({ ...prev, intake: value || '' }))
						}
						searchable
						clearable
					/>

					<Text size='sm' c='dimmed'>
						{description}
					</Text>

					<Group justify='flex-end' gap='sm'>
						<Button variant='outline' onClick={handleClearFilters}>
							Clear All
						</Button>
						<Button onClick={handleApplyFilters}>Apply Filters</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
