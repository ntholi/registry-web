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
	Card,
	Collapse,
	Divider,
	Group,
	Loader,
	Paper,
	Progress,
	SegmentedControl,
	SimpleGrid,
	Skeleton,
	Stack,
	Table,
	Text,
	ThemeIcon,
	Tooltip,
} from '@mantine/core';
import {
	IconAlertCircle,
	IconCalendar,
	IconChevronDown,
	IconChevronRight,
	IconCoin,
	IconFileInvoice,
	IconHash,
	IconReceipt,
	IconReload,
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
			<Paper p='xl' withBorder>
				<Stack align='center' gap='sm'>
					<ThemeIcon size='xl' variant='light' color='red' radius='xl'>
						<IconAlertCircle size='1.4rem' />
					</ThemeIcon>
					<Text fw={500}>Failed to load invoices</Text>
					<Text size='sm' c='dimmed' ta='center' maw={400}>
						{error instanceof Error
							? error.message
							: 'Unable to connect to Zoho Books. Please try again.'}
					</Text>
				</Stack>
			</Paper>
		);
	}

	if (!summary || summary.totalInvoices === 0) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' gap='sm'>
					<ThemeIcon size='xl' variant='light' color='gray' radius='xl'>
						<IconFileInvoice size='1.4rem' />
					</ThemeIcon>
					<Text fw={500}>No invoices found</Text>
					<Text size='sm' c='dimmed' ta='center'>
						This student does not have any invoices in Zoho Books.
					</Text>
				</Stack>
			</Paper>
		);
	}

	const filtered = filterInvoices(summary.invoices, statusFilter);

	return (
		<Stack gap='md'>
			<SummaryCards summary={summary} />

			<Card withBorder p='md'>
				<Stack gap='md'>
					<Group justify='space-between' align='center'>
						<Group gap='xs'>
							<IconReceipt size='1.2rem' color='var(--mantine-color-dimmed)' />
							<Text fw={500} size='sm'>
								Invoices ({filtered.length})
							</Text>
						</Group>
						<Group gap='xs'>
							<SegmentedControl
								size='xs'
								value={statusFilter}
								onChange={(v) => setStatusFilter(v as StatusFilter)}
								data={STATUS_FILTERS.map((f) => ({
									label: f.label,
									value: f.value,
								}))}
							/>
							<Tooltip label='Refresh'>
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
									<IconReload size='1rem' />
								</ActionIcon>
							</Tooltip>
						</Group>
					</Group>

					{filtered.length === 0 ? (
						<Text c='dimmed' size='sm' ta='center' py='md'>
							No invoices match the selected filter.
						</Text>
					) : (
						<Stack gap={0}>
							{filtered.map((invoice) => (
								<InvoiceRow key={invoice.invoice_id} invoice={invoice} />
							))}
						</Stack>
					)}
				</Stack>
			</Card>
		</Stack>
	);
}

type SummaryCardsProps = {
	summary: StudentInvoiceSummary;
};

function SummaryCards({ summary }: SummaryCardsProps) {
	const paidPercent =
		summary.totalAmount > 0
			? (summary.totalPaid / summary.totalAmount) * 100
			: 0;

	return (
		<SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing='sm'>
			<SummaryCard
				label='Total Invoices'
				value={String(summary.totalInvoices)}
				icon={<IconFileInvoice size='1.2rem' />}
				color='blue'
			/>
			<SummaryCard
				label='Total Amount'
				value={formatCurrency(summary.totalAmount)}
				icon={<IconCoin size='1.2rem' />}
				color='violet'
			/>
			<SummaryCard
				label='Total Paid'
				value={formatCurrency(summary.totalPaid)}
				icon={<IconReceipt size='1.2rem' />}
				color='green'
			/>
			<Card withBorder p='sm'>
				<Stack gap={4}>
					<Group justify='space-between'>
						<Text size='xs' c='dimmed' tt='uppercase' fw={600}>
							Outstanding
						</Text>
						<ThemeIcon
							size='sm'
							variant='light'
							color={summary.totalOutstanding > 0 ? 'red' : 'green'}
							radius='xl'
						>
							<IconCoin size='0.8rem' />
						</ThemeIcon>
					</Group>
					<Text
						fw={700}
						size='lg'
						c={summary.totalOutstanding > 0 ? 'red' : 'green'}
					>
						{formatCurrency(summary.totalOutstanding)}
					</Text>
					<Progress
						value={paidPercent}
						color={paidPercent === 100 ? 'green' : 'blue'}
						size='xs'
						mt={4}
					/>
					<Text size='xs' c='dimmed'>
						{paidPercent.toFixed(0)}% paid
					</Text>
				</Stack>
			</Card>
		</SimpleGrid>
	);
}

type SummaryCardProps = {
	label: string;
	value: string;
	icon: React.ReactNode;
	color: string;
};

function SummaryCard({ label, value, icon, color }: SummaryCardProps) {
	return (
		<Card withBorder p='sm'>
			<Stack gap={4}>
				<Group justify='space-between'>
					<Text size='xs' c='dimmed' tt='uppercase' fw={600}>
						{label}
					</Text>
					<ThemeIcon size='sm' variant='light' color={color} radius='xl'>
						{icon}
					</ThemeIcon>
				</Group>
				<Text fw={700} size='lg'>
					{value}
				</Text>
			</Stack>
		</Card>
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
	const _hasDetails = lineItems.length > 0 || isLoading;

	return (
		<>
			<Paper
				p='sm'
				withBorder={false}
				style={{
					cursor: 'pointer',
					borderBottom: '1px solid var(--mantine-color-default-border)',
				}}
				onClick={() => setExpanded(!expanded)}
			>
				<Group justify='space-between' wrap='nowrap'>
					<Group gap='sm' wrap='nowrap' style={{ flex: 1 }}>
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

						<Stack gap={2} style={{ flex: 1 }}>
							<Group gap='xs'>
								<Text size='sm' fw={600}>
									{invoice.invoice_number}
								</Text>
								<InvoiceStatusBadge status={invoice.status} />
							</Group>
							<Group gap='xs'>
								<IconCalendar
									size='0.75rem'
									color='var(--mantine-color-dimmed)'
								/>
								<Text size='xs' c='dimmed'>
									{formatDate(invoice.date, 'short')}
								</Text>
								{invoice.due_date && (
									<>
										<Text size='xs' c='dimmed'>
											→
										</Text>
										<Text
											size='xs'
											c={invoice.status === 'overdue' ? 'red' : 'dimmed'}
										>
											Due {formatDate(invoice.due_date, 'short')}
										</Text>
									</>
								)}
							</Group>
						</Stack>
					</Group>

					<Stack gap={2} align='flex-end'>
						<Text fw={600} size='sm'>
							{formatCurrency(invoice.total)}
						</Text>
						{invoice.balance > 0 && (
							<Text size='xs' c='red'>
								Balance: {formatCurrency(invoice.balance)}
							</Text>
						)}
					</Stack>
				</Group>
			</Paper>

			<Collapse in={expanded}>
				<Paper p='sm' bg='var(--mantine-color-body)' ml='xl'>
					{isLoading && !isFetched ? (
						<Group justify='center' py='sm'>
							<Loader size='xs' />
							<Text size='xs' c='dimmed'>
								Loading line items...
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
							<Divider my='xs' />
							<Group gap='xs'>
								<IconHash size='0.75rem' color='var(--mantine-color-dimmed)' />
								<Text size='xs' c='dimmed'>
									Ref: {invoice.reference_number}
								</Text>
							</Group>
						</>
					)}
				</Paper>
			</Collapse>
		</>
	);
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
		<Badge size='xs' variant='light' color={color}>
			{labelMap[status] ?? status}
		</Badge>
	);
}

type LineItemsTableProps = {
	items: ZohoLineItem[];
};

function LineItemsTable({ items }: LineItemsTableProps) {
	return (
		<Table
			horizontalSpacing='sm'
			verticalSpacing={4}
			withRowBorders={false}
			fz='xs'
		>
			<Table.Thead>
				<Table.Tr>
					<Table.Th>Item</Table.Th>
					<Table.Th ta='right'>Qty</Table.Th>
					<Table.Th ta='right'>Rate</Table.Th>
					<Table.Th ta='right'>Total</Table.Th>
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{items.map((item) => (
					<Table.Tr key={item.line_item_id}>
						<Table.Td>
							<Stack gap={0}>
								<Text size='xs' fw={500}>
									{item.name ?? 'Unnamed'}
								</Text>
								{item.description && (
									<Text size='xs' c='dimmed' lineClamp={1}>
										{item.description}
									</Text>
								)}
							</Stack>
						</Table.Td>
						<Table.Td ta='right'>{item.quantity}</Table.Td>
						<Table.Td ta='right'>{formatCurrency(item.rate)}</Table.Td>
						<Table.Td ta='right' fw={500}>
							{formatCurrency(item.item_total)}
						</Table.Td>
					</Table.Tr>
				))}
			</Table.Tbody>
		</Table>
	);
}

function InvoicesLoader() {
	return (
		<Stack gap='md'>
			<SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing='sm'>
				{Array.from({ length: 4 }).map((_, i) => (
					<Card withBorder p='sm' key={`skeleton-card-${i}`}>
						<Stack gap='xs'>
							<Skeleton height={12} width='60%' />
							<Skeleton height={24} width='80%' />
						</Stack>
					</Card>
				))}
			</SimpleGrid>
			<Card withBorder p='md'>
				<Stack gap='sm'>
					<Skeleton height={14} width='30%' />
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton height={50} key={`skeleton-row-${i}`} />
					))}
				</Stack>
			</Card>
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
