'use client';

import {
	Badge,
	Box,
	Collapse,
	Paper,
	Stack,
	Table,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { IconChevronDown, IconDatabaseOff } from '@tabler/icons-react';
import { useState } from 'react';
import { formatDate } from '@/shared/lib/utils/dates';
import { formatCurrency } from '@/shared/lib/utils/utils';

export type TransactionColumn<T> = {
	key: string;
	label: string;
	align?: 'left' | 'right' | 'center';
	render: (row: T) => React.ReactNode;
};

type TransactionTableProps<T> = {
	data: T[];
	columns: TransactionColumn<T>[];
	rowKey: (row: T) => string;
	emptyLabel: string;
	renderDetail?: (row: T) => React.ReactNode;
};

export function TransactionTable<T>({
	data,
	columns,
	rowKey,
	emptyLabel,
	renderDetail,
}: TransactionTableProps<T>) {
	const [expandedId, setExpandedId] = useState<string | null>(null);

	if (data.length === 0) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' gap='xs' py='md'>
					<ThemeIcon size='lg' variant='light' color='gray'>
						<IconDatabaseOff size='1rem' />
					</ThemeIcon>
					<Text c='dimmed' size='sm'>
						{emptyLabel}
					</Text>
				</Stack>
			</Paper>
		);
	}

	return (
		<Paper withBorder style={{ overflow: 'hidden' }}>
			<Table.ScrollContainer minWidth={600}>
				<Table horizontalSpacing='md' verticalSpacing='xs'>
					<Table.Thead>
						<Table.Tr>
							{renderDetail && <Table.Th w={36} />}
							{columns.map((col) => (
								<Table.Th
									key={col.key}
									ta={col.align}
									fw={600}
									fz='xs'
									c='dimmed'
									tt='uppercase'
									lts={0.3}
								>
									{col.label}
								</Table.Th>
							))}
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{data.map((row) => {
							const id = rowKey(row);
							const isExpanded = expandedId === id;

							return (
								<ExpandableRow
									key={id}
									row={row}
									columns={columns}
									isExpanded={isExpanded}
									colSpan={columns.length + (renderDetail ? 1 : 0)}
									onToggle={() => setExpandedId(isExpanded ? null : id)}
									renderDetail={renderDetail}
								/>
							);
						})}
					</Table.Tbody>
				</Table>
			</Table.ScrollContainer>
		</Paper>
	);
}

type ExpandableRowProps<T> = {
	row: T;
	columns: TransactionColumn<T>[];
	isExpanded: boolean;
	colSpan: number;
	onToggle: () => void;
	renderDetail?: (row: T) => React.ReactNode;
};

function ExpandableRow<T>({
	row,
	columns,
	isExpanded,
	colSpan,
	onToggle,
	renderDetail,
}: ExpandableRowProps<T>) {
	const clickable = !!renderDetail;

	return (
		<>
			<Table.Tr
				style={clickable ? { cursor: 'pointer' } : undefined}
				onClick={clickable ? onToggle : undefined}
				bg={isExpanded ? 'var(--mantine-color-default-hover)' : undefined}
			>
				{clickable && (
					<Table.Td w={36} p={0} ta='center'>
						<Box
							component={IconChevronDown}
							size='0.9rem'
							c='dimmed'
							style={{
								transition: 'transform 200ms',
								transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
							}}
						/>
					</Table.Td>
				)}
				{columns.map((col) => (
					<Table.Td key={col.key} ta={col.align}>
						{col.render(row)}
					</Table.Td>
				))}
			</Table.Tr>
			{clickable && (
				<Table.Tr>
					<Table.Td colSpan={colSpan} p={0} bd='none'>
						<Collapse in={isExpanded}>
							<Box px='lg' py='md' bg='var(--mantine-color-body)'>
								{isExpanded && renderDetail!(row)}
							</Box>
						</Collapse>
					</Table.Td>
				</Table.Tr>
			)}
		</>
	);
}

type StatusBadgeProps = {
	status: string;
	colorMap: Record<string, string>;
	labelMap?: Record<string, string>;
};

export function StatusBadge({ status, colorMap, labelMap }: StatusBadgeProps) {
	const color = colorMap[status] ?? 'gray';
	const label = labelMap?.[status] ?? (status || 'Paid');

	return (
		<Badge size='sm' variant='light' color={color}>
			{label}
		</Badge>
	);
}

export function DateCell({ date }: { date: string }) {
	return (
		<Text size='sm' c='dimmed'>
			{formatDate(date, 'short')}
		</Text>
	);
}

export function CurrencyCell({
	amount,
	color,
}: {
	amount: number;
	color?: string;
}) {
	return (
		<Text size='sm' fw={600} ff='monospace' c={color}>
			{formatCurrency(amount)}
		</Text>
	);
}

export function NumberCell({ value }: { value: string }) {
	return (
		<Text size='sm' fw={500}>
			{value}
		</Text>
	);
}

export function RefCell({ value }: { value?: string }) {
	if (!value)
		return (
			<Text size='sm' c='dimmed'>
				-
			</Text>
		);
	return (
		<Text size='sm' c='dimmed' ff='monospace'>
			{value}
		</Text>
	);
}

type DetailFieldProps = {
	label: string;
	value: React.ReactNode;
};

export function DetailField({ label, value }: DetailFieldProps) {
	return (
		<Stack gap={2}>
			<Text size='xs' c='dimmed' tt='uppercase' lts={0.3} fw={600}>
				{label}
			</Text>
			<Text size='sm'>{value || '-'}</Text>
		</Stack>
	);
}

type LineItemsTableProps = {
	items: {
		name?: string;
		description?: string;
		quantity: number;
		rate: number;
		item_total: number;
	}[];
};

export function LineItemsTable({ items }: LineItemsTableProps) {
	if (items.length === 0) return null;

	return (
		<Table verticalSpacing={4} horizontalSpacing='sm' fz='xs'>
			<Table.Thead>
				<Table.Tr>
					<Table.Th fw={600} c='dimmed' tt='uppercase' lts={0.3}>
						Item
					</Table.Th>
					<Table.Th fw={600} c='dimmed' tt='uppercase' lts={0.3} ta='right'>
						Qty
					</Table.Th>
					<Table.Th fw={600} c='dimmed' tt='uppercase' lts={0.3} ta='right'>
						Rate
					</Table.Th>
					<Table.Th fw={600} c='dimmed' tt='uppercase' lts={0.3} ta='right'>
						Amount
					</Table.Th>
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{items.map((item, i) => (
					<Table.Tr key={`item-${i}`}>
						<Table.Td>
							<Text size='xs' fw={500}>
								{item.name || 'Item'}
							</Text>
							{item.description && (
								<Text size='xs' c='dimmed' lineClamp={2}>
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
							<Text size='xs' fw={600} ff='monospace'>
								{formatCurrency(item.item_total)}
							</Text>
						</Table.Td>
					</Table.Tr>
				))}
			</Table.Tbody>
		</Table>
	);
}
