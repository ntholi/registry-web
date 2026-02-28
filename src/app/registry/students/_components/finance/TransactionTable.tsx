import { Badge, Paper, Stack, Table, Text, ThemeIcon } from '@mantine/core';
import { IconDatabaseOff } from '@tabler/icons-react';
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
};

export function TransactionTable<T>({
	data,
	columns,
	rowKey,
	emptyLabel,
}: TransactionTableProps<T>) {
	if (data.length === 0) {
		return (
			<Paper p='xl' withBorder radius='md'>
				<Stack align='center' gap='xs' py='md'>
					<ThemeIcon size='lg' variant='light' color='gray' radius='xl'>
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
		<Paper withBorder radius='md' style={{ overflow: 'hidden' }}>
			<Table.ScrollContainer minWidth={600}>
				<Table
					horizontalSpacing='md'
					verticalSpacing='xs'
					highlightOnHover
				>
					<Table.Thead>
						<Table.Tr>
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
						{data.map((row) => (
							<Table.Tr key={rowKey(row)}>
								{columns.map((col) => (
									<Table.Td key={col.key} ta={col.align}>
										{col.render(row)}
									</Table.Td>
								))}
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</Table.ScrollContainer>
		</Paper>
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
		<Badge size='sm' variant='light' color={color} radius='sm'>
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
