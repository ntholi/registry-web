'use client';

import { Table, Text } from '@mantine/core';
import type { SummaryRow } from '../_server/repository';

const STATUSES = [
	'draft',
	'submitted',
	'under_review',
	'accepted_first_choice',
	'accepted_second_choice',
	'rejected',
	'waitlisted',
] as const;

const STATUS_LABELS: Record<string, string> = {
	draft: 'Draft',
	submitted: 'Submitted',
	under_review: 'Under Review',
	accepted_first_choice: '1st Choice',
	accepted_second_choice: '2nd Choice',
	rejected: 'Rejected',
	waitlisted: 'Waitlisted',
};

const STATUS_COLORS: Record<string, string> = {
	draft: 'var(--mantine-color-gray-4)',
	submitted: 'var(--mantine-color-blue-4)',
	under_review: 'var(--mantine-color-yellow-4)',
	accepted_first_choice: 'var(--mantine-color-green-4)',
	accepted_second_choice: 'var(--mantine-color-teal-4)',
	rejected: 'var(--mantine-color-red-4)',
	waitlisted: 'var(--mantine-color-orange-4)',
};

type Props = {
	data: SummaryRow[];
};

export default function SummaryTable({ data }: Props) {
	const totals = STATUSES.reduce(
		(acc, s) => {
			acc[s] = data.reduce((sum, r) => sum + r.counts[s], 0);
			return acc;
		},
		{} as Record<string, number>
	);
	const grandTotal = data.reduce((sum, r) => sum + r.counts.total, 0);

	return (
		<Table.ScrollContainer minWidth={900}>
			<Table striped highlightOnHover withTableBorder withColumnBorders>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>School</Table.Th>
						<Table.Th>Program</Table.Th>
						{STATUSES.map((s) => (
							<Table.Th key={s} ta='center' fz='xs' c={STATUS_COLORS[s]}>
								{STATUS_LABELS[s]}
							</Table.Th>
						))}
						<Table.Th ta='center'>Total</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{data.map((row) => (
						<Table.Tr key={`${row.schoolId}-${row.programId}`}>
							<Table.Td>{row.schoolName}</Table.Td>
							<Table.Td>{row.programName}</Table.Td>
							{STATUSES.map((s) => (
								<Table.Td key={s} ta='center'>
									{row.counts[s] || '-'}
								</Table.Td>
							))}
							<Table.Td ta='center' fw={600}>
								{row.counts.total}
							</Table.Td>
						</Table.Tr>
					))}
				</Table.Tbody>
				<Table.Tfoot>
					<Table.Tr>
						<Table.Td colSpan={2}>
							<Text fw={700}>Total</Text>
						</Table.Td>
						{STATUSES.map((s) => (
							<Table.Td key={s} ta='center' fw={700}>
								{totals[s]}
							</Table.Td>
						))}
						<Table.Td ta='center' fw={700}>
							{grandTotal}
						</Table.Td>
					</Table.Tr>
				</Table.Tfoot>
			</Table>
		</Table.ScrollContainer>
	);
}
