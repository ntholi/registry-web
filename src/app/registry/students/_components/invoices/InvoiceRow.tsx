import { fetchInvoiceDetail } from '@finance/_lib/zoho-books/actions';
import type {
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
	Stack,
	Table,
	Text,
} from '@mantine/core';
import {
	IconCalendarDue,
	IconChevronDown,
	IconChevronRight,
	IconHash,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { statusColors } from '@/shared/lib/utils/colors';
import { formatDate } from '@/shared/lib/utils/dates';
import { formatCurrency } from '@/shared/lib/utils/utils';

type InvoiceRowProps = {
	invoice: ZohoInvoice;
};

export function InvoiceRow({ invoice }: InvoiceRowProps) {
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
		<Paper radius='md' withBorder>
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
