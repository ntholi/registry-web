'use client';

import {
	ActionIcon,
	Badge,
	Group,
	Paper,
	ScrollArea,
	Stack,
	Table,
	Text,
	Tooltip,
} from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';

type ResultsTableProps = {
	columns: string[];
	rows: Record<string, unknown>[];
	rowCount: number;
	executionTime: number;
};

function formatColumnName(col: string): string {
	return col.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCellValue(value: unknown): string {
	if (value === null || value === undefined) return '—';
	if (value instanceof Date) return value.toLocaleDateString();
	if (typeof value === 'object') return JSON.stringify(value);
	return String(value);
}

function exportToCsv(columns: string[], rows: Record<string, unknown>[]) {
	const header = columns.join(',');
	const body = rows
		.map((row) =>
			columns
				.map((col) => {
					const val = formatCellValue(row[col]);
					return val.includes(',') || val.includes('"')
						? `"${val.replace(/"/g, '""')}"`
						: val;
				})
				.join(',')
		)
		.join('\n');
	const csv = `${header}\n${body}`;
	const blob = new Blob([csv], { type: 'text/csv' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `query-results-${Date.now()}.csv`;
	a.click();
	URL.revokeObjectURL(url);
}

export default function ResultsTable({
	columns,
	rows,
	rowCount,
	executionTime,
}: ResultsTableProps) {
	return (
		<Paper withBorder radius='md' p='md'>
			<Stack gap='sm'>
				<Group justify='space-between'>
					<Group gap='xs'>
						<Badge variant='light' color='teal' size='sm'>
							{rowCount} {rowCount === 1 ? 'row' : 'rows'}
						</Badge>
						<Badge variant='light' color='gray' size='sm'>
							{executionTime}ms
						</Badge>
					</Group>
					<Tooltip label='Export to CSV'>
						<ActionIcon
							variant='subtle'
							color='gray'
							onClick={() => exportToCsv(columns, rows)}
						>
							<IconDownload size={16} />
						</ActionIcon>
					</Tooltip>
				</Group>

				{rows.length === 0 ? (
					<Text c='dimmed' ta='center' py='xl' size='sm'>
						No results found
					</Text>
				) : (
					<ScrollArea>
						<Table
							striped
							highlightOnHover
							withTableBorder
							withColumnBorders
							fz='sm'
						>
							<Table.Thead>
								<Table.Tr>
									<Table.Th
										style={{
											width: 40,
											textAlign: 'center',
											whiteSpace: 'nowrap',
										}}
									>
										#
									</Table.Th>
									{columns.map((col) => (
										<Table.Th key={col} style={{ whiteSpace: 'nowrap' }}>
											{formatColumnName(col)}
										</Table.Th>
									))}
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{rows.map((row, i) => (
									<Table.Tr key={i}>
										<Table.Td
											style={{ textAlign: 'center' }}
											c='dimmed'
											fz='xs'
										>
											{i + 1}
										</Table.Td>
										{columns.map((col) => (
											<Table.Td
												key={col}
												style={{
													whiteSpace: 'nowrap',
													maxWidth: 300,
													overflow: 'hidden',
													textOverflow: 'ellipsis',
												}}
											>
												{formatCellValue(row[col])}
											</Table.Td>
										))}
									</Table.Tr>
								))}
							</Table.Tbody>
						</Table>
					</ScrollArea>
				)}
			</Stack>
		</Paper>
	);
}
