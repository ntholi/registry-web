'use client';

import { fetchStudentInvoices } from '@finance/_lib/zoho-books/actions';
import type { ZohoInvoice } from '@finance/_lib/zoho-books/types';
import {
	ActionIcon,
	Group,
	Paper,
	SegmentedControl,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
	Tooltip,
} from '@mantine/core';
import {
	IconAlertTriangle,
	IconFileInvoice,
	IconRefresh,
} from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FinancialOverview } from './FinancialOverview';
import { InvoiceRow } from './InvoiceRow';

type Props = {
	stdNo: number;
	isActive: boolean;
};

const STATUS_FILTERS = [
	{ label: 'All', value: 'all' },
	{ label: 'Paid', value: 'paid' },
	{ label: 'Unpaid', value: 'unpaid' },
	{ label: 'Overdue', value: 'overdue' },
	{ label: 'Partial', value: 'partially_paid' },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]['value'];

export default function InvoicesView({ stdNo, isActive }: Props) {
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
	const queryClient = useQueryClient();

	const {
		data: summary,
		isLoading,
		isError,
		error,
		isFetching,
	} = useQuery({
		queryKey: ['student-invoices', stdNo],
		queryFn: () => fetchStudentInvoices(stdNo),
		enabled: isActive,
		staleTime: 1000 * 60 * 5,
	});

	if (!isActive) return null;

	if (isLoading) return <InvoicesLoader />;

	if (isError) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' gap='md' py='lg'>
					<ThemeIcon size={56} variant='light' color='red' radius='xl'>
						<IconAlertTriangle size='1.6rem' />
					</ThemeIcon>
					<Stack align='center' gap={4}>
						<Text fw={600} size='lg'>
							Unable to load invoices
						</Text>
						<Text size='sm' c='dimmed' ta='center' maw={360}>
							{error instanceof Error
								? error.message
								: 'Could not connect to Zoho Books. Please try again later.'}
						</Text>
					</Stack>
				</Stack>
			</Paper>
		);
	}

	if (!summary || summary.totalInvoices === 0) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' gap='md' py='lg'>
					<ThemeIcon size={56} variant='light' color='gray' radius='xl'>
						<IconFileInvoice size='1.6rem' />
					</ThemeIcon>
					<Stack align='center' gap={4}>
						<Text fw={600} size='lg'>
							No invoices
						</Text>
						<Text size='sm' c='dimmed' ta='center'>
							This student has no invoices in Zoho Books.
						</Text>
					</Stack>
				</Stack>
			</Paper>
		);
	}

	const filtered = filterInvoices(summary.invoices, statusFilter);

	return (
		<Stack gap='lg'>
			<FinancialOverview summary={summary} />

			<Stack gap='xs'>
				<Group justify='space-between' align='center'>
					<Text fw={600} size='sm' c='dimmed' tt='uppercase' lts={0.5}>
						Invoices
					</Text>
					<Group gap='xs'>
						<SegmentedControl
							size='sm'
							value={statusFilter}
							onChange={(v) => setStatusFilter(v as StatusFilter)}
							data={STATUS_FILTERS.map((f) => ({
								label: f.label,
								value: f.value,
							}))}
						/>
						<Tooltip label='Refresh' withArrow>
							<ActionIcon
								variant='subtle'
								color='gray'
								size='sm'
								loading={isFetching}
								onClick={() =>
									queryClient.invalidateQueries({
										queryKey: ['student-invoices', stdNo],
									})
								}
							>
								<IconRefresh size='1rem' />
							</ActionIcon>
						</Tooltip>
					</Group>
				</Group>

				{filtered.length === 0 ? (
					<Paper p='xl' withBorder>
						<Text c='dimmed' size='sm' ta='center'>
							No invoices match this filter.
						</Text>
					</Paper>
				) : (
					<Stack gap='xs'>
						{filtered.map((invoice) => (
							<InvoiceRow key={invoice.invoice_id} invoice={invoice} />
						))}
					</Stack>
				)}
			</Stack>
		</Stack>
	);
}

function InvoicesLoader() {
	return (
		<Stack gap='lg'>
			<Paper p='lg' withBorder>
				<Stack gap='md'>
					<Group justify='space-between' align='flex-start' wrap='nowrap'>
						<Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
							<Skeleton height={10} width={120} />
						</Stack>
						<Skeleton height={24} width={90} />
					</Group>
					<Group gap='3rem' wrap='nowrap'>
						{Array.from({ length: 3 }).map((_, i) => (
							<Stack gap={4} key={`skeleton-metric-${i}`}>
								<Skeleton height={10} width={50} />
								<Skeleton height={20} width={90} />
							</Stack>
						))}
					</Group>
				</Stack>
			</Paper>
			<Stack gap='xs'>
				<Group justify='space-between' align='center' wrap='nowrap'>
					<Skeleton height={14} width={60} />
					<Group gap='xs' wrap='nowrap'>
						<Skeleton height={32} width={250} />
						<Skeleton height={28} width={28} circle />
					</Group>
				</Group>
				{Array.from({ length: 4 }).map((_, i) => (
					<Paper p='sm' withBorder key={`skeleton-row-${i}`}>
						<Group justify='space-between' wrap='nowrap'>
							<Group gap='sm' wrap='nowrap' style={{ flex: 1, minWidth: 0 }}>
								<Skeleton height={20} width={20} radius='sm' />
								<Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
									<Group gap='xs' wrap='nowrap'>
										<Skeleton height={14} width='35%' />
										<Skeleton height={18} width={64} radius='xl' />
									</Group>
									<Skeleton height={10} width='45%' />
								</Stack>
							</Group>
							<Stack gap={4} align='flex-end' miw={100}>
								<Skeleton height={14} width={80} />
								<Skeleton height={10} width={60} />
							</Stack>
						</Group>
					</Paper>
				))}
			</Stack>
		</Stack>
	);
}

function filterInvoices(
	invoices: ZohoInvoice[],
	filter: StatusFilter
): ZohoInvoice[] {
	if (filter === 'all') return invoices;
	return invoices.filter((inv) => inv.status === filter);
}
