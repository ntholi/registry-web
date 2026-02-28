'use client';

import {
	fetchInvoiceDetail,
	fetchStudentInvoices,
} from '@finance/_lib/zoho-books/actions';
import type {
	StudentInvoiceSummary,
	ZohoInvoice,
	ZohoInvoiceStatus,
	ZohoLineItem,
} from '@finance/_lib/zoho-books/types';
import {
	ActionIcon,
	Badge,
	Box,
	Collapse,
	Divider,
	Group,
	Loader,
	Paper,
	RingProgress,
	SegmentedControl,
	Skeleton,
	Stack,
	Table,
	Text,
	ThemeIcon,
	Tooltip,
} from '@mantine/core';
import {
	IconAlertTriangle,
	IconCalendarDue,
	IconCheck,
	IconChevronDown,
	IconChevronRight,
	IconCoin,
	IconFileInvoice,
	IconHash,
	IconRefresh,
	IconWallet,
} from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { statusColors } from '@/shared/lib/utils/colors';
import { formatDate } from '@/shared/lib/utils/dates';
import { formatCurrency } from '@/shared/lib/utils/utils';

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
	{ label: 'Other', value: 'other' },
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
			<Paper p='xl' radius='md' withBorder>
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
			<Paper p='xl' radius='md' withBorder>
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
							size='xs'
							radius='md'
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
					<Paper p='xl' radius='md' withBorder>
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

type FinancialOverviewProps = {
	summary: StudentInvoiceSummary;
};

function FinancialOverview({ summary }: FinancialOverviewProps) {
	const paidPercent =
		summary.totalAmount > 0
			? Math.round((summary.totalPaid / summary.totalAmount) * 100)
			: 0;

	const ringColor =
		paidPercent === 100 ? 'green' : paidPercent >= 50 ? 'blue' : 'orange';

	return (
		<Paper p='lg' radius='md' withBorder>
			<Group justify='space-between' align='flex-start' wrap='nowrap'>
				<Group gap='xl' wrap='nowrap'>
					<RingProgress
						size={100}
						thickness={8}
						roundCaps
						sections={[{ value: paidPercent, color: ringColor }]}
						label={
							<Stack align='center' gap={0}>
								<Text fw={700} size='lg' lh={1}>
									{paidPercent}%
								</Text>
								<Text size='xs' c='dimmed' lh={1.2}>
									paid
								</Text>
							</Stack>
						}
					/>

					<Stack gap='xs'>
						<Text size='xs' c='dimmed' tt='uppercase' fw={600} lts={0.5}>
							Financial Summary
						</Text>
						<Group gap='xl'>
							<MetricItem
								label='Total'
								value={formatCurrency(summary.totalAmount)}
								icon={<IconCoin size='0.9rem' />}
								color='violet'
							/>
							<MetricItem
								label='Paid'
								value={formatCurrency(summary.totalPaid)}
								icon={<IconCheck size='0.9rem' />}
								color='green'
							/>
							<MetricItem
								label='Outstanding'
								value={formatCurrency(summary.totalOutstanding)}
								icon={<IconWallet size='0.9rem' />}
								color={summary.totalOutstanding > 0 ? 'red' : 'green'}
							/>
						</Group>
					</Stack>
				</Group>

				<Badge
					size='lg'
					variant='light'
					color={summary.totalOutstanding > 0 ? 'red' : 'green'}
					radius='md'
				>
					{summary.totalInvoices} invoice
					{summary.totalInvoices !== 1 ? 's' : ''}
				</Badge>
			</Group>
		</Paper>
	);
}

type MetricItemProps = {
	label: string;
	value: string;
	icon: React.ReactNode;
	color: string;
};

function MetricItem({ label, value, icon, color }: MetricItemProps) {
	return (
		<Stack gap={2}>
			<Group gap={4}>
				<ThemeIcon size='xs' variant='transparent' color={color}>
					{icon}
				</ThemeIcon>
				<Text size='xs' c='dimmed'>
					{label}
				</Text>
			</Group>
			<Text fw={700} size='md'>
				{value}
			</Text>
		</Stack>
	);
}

type InvoiceRowProps = {
	invoice: ZohoInvoice;
};

function InvoiceRow({ invoice }: InvoiceRowProps) {
	const [expanded, setExpanded] = useState(false);

	const {
		data: detail,
		isLoading,
		isFetched,
	} = useQuery({
		queryKey: ['invoice-detail', invoice.invoice_id],
		queryFn: () => fetchInvoiceDetail(invoice.invoice_id),
		enabled: expanded && !invoice.line_items?.length,
		staleTime: 1000 * 60 * 10,
	});

	const lineItems = invoice.line_items ?? detail?.line_items ?? [];
	const isPaid = invoice.status === 'paid';
	const isOverdue = invoice.status === 'overdue';

	return (
		<Paper
			radius='md'
			withBorder
			style={{
				overflow: 'hidden',
				borderLeftWidth: 3,
				borderLeftColor: `var(--mantine-color-${invoiceAccentColor(invoice.status)}-${isOverdue ? 6 : 4})`,
			}}
		>
			<Box
				p='sm'
				style={{ cursor: 'pointer' }}
				onClick={() => setExpanded(!expanded)}
			>
				<Group justify='space-between' wrap='nowrap'>
					<Group gap='sm' wrap='nowrap' style={{ flex: 1, minWidth: 0 }}>
						<ActionIcon
							variant='subtle'
							color='gray'
							size='xs'
							onClick={(e) => {
								e.stopPropagation();
								setExpanded(!expanded);
							}}
						>
							{expanded ? (
								<IconChevronDown size='0.9rem' />
							) : (
								<IconChevronRight size='0.9rem' />
							)}
						</ActionIcon>

						<Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
							<Group gap='xs' wrap='nowrap'>
								<Text size='sm' fw={600} truncate>
									{invoice.invoice_number}
								</Text>
								<InvoiceStatusBadge status={invoice.status} />
							</Group>
							<Group gap='xs' wrap='nowrap'>
								<IconCalendarDue
									size='0.75rem'
									color='var(--mantine-color-dimmed)'
								/>
								<Text size='xs' c='dimmed'>
									{formatDate(invoice.date, 'short')}
								</Text>
								{invoice.due_date && (
									<Text size='xs' c={isOverdue ? 'red' : 'dimmed'}>
										{' '}
										&middot; Due {formatDate(invoice.due_date, 'short')}
									</Text>
								)}
							</Group>
						</Stack>
					</Group>

					<Stack gap={2} align='flex-end' miw={100}>
						<Text fw={700} size='sm' ff='monospace'>
							{formatCurrency(invoice.total)}
						</Text>
						{invoice.balance > 0 && !isPaid && (
							<Text size='xs' c='red' ff='monospace'>
								−{formatCurrency(invoice.balance)}
							</Text>
						)}
					</Stack>
				</Group>
			</Box>

			<Collapse in={expanded}>
				<Divider />
				<Box p='sm' bg='var(--mantine-color-body)'>
					{isLoading && !isFetched ? (
						<Group justify='center' py='sm'>
							<Loader size='xs' type='dots' />
							<Text size='xs' c='dimmed'>
								Loading details…
							</Text>
						</Group>
					) : lineItems.length > 0 ? (
						<LineItemsTable items={lineItems} />
					) : (
						<Text size='xs' c='dimmed' ta='center' py='xs'>
							No line items available.
						</Text>
					)}

					{invoice.reference_number && (
						<>
							<Divider my='xs' variant='dashed' />
							<Group gap={6}>
								<IconHash size='0.7rem' color='var(--mantine-color-dimmed)' />
								<Text size='xs' c='dimmed' ff='monospace'>
									{invoice.reference_number}
								</Text>
							</Group>
						</>
					)}
				</Box>
			</Collapse>
		</Paper>
	);
}

function invoiceAccentColor(status: ZohoInvoiceStatus): string {
	const map: Record<ZohoInvoiceStatus, string> = {
		paid: 'green',
		overdue: 'red',
		unpaid: 'orange',
		partially_paid: 'yellow',
		draft: 'gray',
		sent: 'blue',
		viewed: 'cyan',
		void: 'gray',
	};
	return map[status] ?? 'gray';
}

type InvoiceStatusBadgeProps = {
	status: ZohoInvoiceStatus;
};

function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
	const colorMap = statusColors.invoiceStatus;
	const color =
		colorMap[status as keyof typeof colorMap] ??
		statusColors.invoiceStatus.draft;

	const labelMap: Record<ZohoInvoiceStatus, string> = {
		draft: 'Draft',
		sent: 'Sent',
		overdue: 'Overdue',
		paid: 'Paid',
		partially_paid: 'Partial',
		unpaid: 'Unpaid',
		viewed: 'Viewed',
		void: 'Void',
	};

	return (
		<Badge size='xs' variant='dot' color={color} radius='sm'>
			{labelMap[status] ?? status}
		</Badge>
	);
}

type LineItemsTableProps = {
	items: ZohoLineItem[];
};

function LineItemsTable({ items }: LineItemsTableProps) {
	const total = items.reduce((sum, it) => sum + it.item_total, 0);

	return (
		<Table
			horizontalSpacing='sm'
			verticalSpacing={6}
			withRowBorders={false}
			fz='xs'
		>
			<Table.Thead>
				<Table.Tr>
					<Table.Th
						style={{ color: 'var(--mantine-color-dimmed)', fontWeight: 500 }}
					>
						Item
					</Table.Th>
					<Table.Th
						ta='right'
						style={{ color: 'var(--mantine-color-dimmed)', fontWeight: 500 }}
					>
						Qty
					</Table.Th>
					<Table.Th
						ta='right'
						style={{ color: 'var(--mantine-color-dimmed)', fontWeight: 500 }}
					>
						Rate
					</Table.Th>
					<Table.Th
						ta='right'
						style={{ color: 'var(--mantine-color-dimmed)', fontWeight: 500 }}
					>
						Amount
					</Table.Th>
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{items.map((item) => (
					<Table.Tr key={item.line_item_id}>
						<Table.Td>
							<Text size='xs' fw={500}>
								{item.name ?? 'Unnamed'}
							</Text>
							{item.description && (
								<Text size='xs' c='dimmed' lineClamp={1}>
									{item.description}
								</Text>
							)}
						</Table.Td>
						<Table.Td ta='right'>
							<Text size='xs' ff='monospace'>
								{item.quantity}
							</Text>
						</Table.Td>
						<Table.Td ta='right'>
							<Text size='xs' ff='monospace'>
								{formatCurrency(item.rate)}
							</Text>
						</Table.Td>
						<Table.Td ta='right'>
							<Text size='xs' fw={500} ff='monospace'>
								{formatCurrency(item.item_total)}
							</Text>
						</Table.Td>
					</Table.Tr>
				))}
			</Table.Tbody>
			<Table.Tfoot>
				<Table.Tr>
					<Table.Td colSpan={3}>
						<Text size='xs' fw={600} ta='right'>
							Total
						</Text>
					</Table.Td>
					<Table.Td ta='right'>
						<Text size='xs' fw={700} ff='monospace'>
							{formatCurrency(total)}
						</Text>
					</Table.Td>
				</Table.Tr>
			</Table.Tfoot>
		</Table>
	);
}

function InvoicesLoader() {
	return (
		<Stack gap='lg'>
			<Paper p='lg' radius='md' withBorder>
				<Group gap='xl' wrap='nowrap'>
					<Skeleton height={100} width={100} circle />
					<Stack gap='sm' style={{ flex: 1 }}>
						<Skeleton height={12} width='40%' />
						<Group gap='xl'>
							<Stack gap={4}>
								<Skeleton height={10} width={50} />
								<Skeleton height={20} width={90} />
							</Stack>
							<Stack gap={4}>
								<Skeleton height={10} width={50} />
								<Skeleton height={20} width={90} />
							</Stack>
							<Stack gap={4}>
								<Skeleton height={10} width={50} />
								<Skeleton height={20} width={90} />
							</Stack>
						</Group>
					</Stack>
				</Group>
			</Paper>
			<Stack gap='xs'>
				<Skeleton height={14} width='20%' />
				{Array.from({ length: 3 }).map((_, i) => (
					<Paper p='sm' radius='md' withBorder key={`skeleton-row-${i}`}>
						<Group justify='space-between'>
							<Stack gap={4} style={{ flex: 1 }}>
								<Skeleton height={14} width='35%' />
								<Skeleton height={10} width='25%' />
							</Stack>
							<Stack gap={4} align='flex-end'>
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
	if (filter === 'other') {
		return invoices.filter(
			(inv) =>
				!['paid', 'unpaid', 'overdue', 'partially_paid'].includes(inv.status)
		);
	}
	return invoices.filter((inv) => inv.status === filter);
}
