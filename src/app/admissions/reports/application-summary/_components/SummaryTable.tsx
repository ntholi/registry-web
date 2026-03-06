'use client';

import { Group, Paper, Stack, Table, Text } from '@mantine/core';
import { IconCash, IconFileText, IconSend } from '@tabler/icons-react';
import type { SummaryRow } from '../_server/repository';

const STATUSES = ['draft', 'submitted', 'submittedPaid'] as const;

const STATUS_LABELS: Record<string, string> = {
	draft: 'Draft',
	submitted: 'Submitted',
	submittedPaid: 'Submitted & Paid',
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
		<Stack>
			<SummaryCards totals={totals} grandTotal={grandTotal} />
			<Table.ScrollContainer minWidth={700}>
				<Table striped highlightOnHover withTableBorder withColumnBorders>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>School</Table.Th>
							<Table.Th>Program</Table.Th>
							<Table.Th ta='center'>Total</Table.Th>
							{STATUSES.map((s) => (
								<Table.Th key={s} ta='center'>
									{STATUS_LABELS[s]}
								</Table.Th>
							))}
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{data.map((row) => (
							<Table.Tr key={`${row.schoolId}-${row.programId}`}>
								<Table.Td>{row.schoolName}</Table.Td>
								<Table.Td>{row.programName}</Table.Td>
								<Table.Td ta='center'>{row.counts.total}</Table.Td>
								{STATUSES.map((s) => (
									<Table.Td key={s} ta='center'>
										{row.counts[s] || '-'}
									</Table.Td>
								))}
							</Table.Tr>
						))}
					</Table.Tbody>
					<Table.Tfoot>
						<Table.Tr>
							<Table.Td colSpan={2}>
								<Text fw={700}>Total</Text>
							</Table.Td>
							<Table.Td ta='center' fw={700}>
								{grandTotal}
							</Table.Td>
							{STATUSES.map((s) => (
								<Table.Td key={s} ta='center' fw={700}>
									{totals[s]}
								</Table.Td>
							))}
						</Table.Tr>
					</Table.Tfoot>
				</Table>
			</Table.ScrollContainer>
		</Stack>
	);
}

type CardDef = {
	label: string;
	value: number;
	icon: React.ReactNode;
	color: string;

	highlight?: boolean;
};

type SummaryCardsProps = {
	totals: Record<string, number>;
	grandTotal?: number;
};

function SummaryCards({ totals }: SummaryCardsProps) {
	const cards: CardDef[] = [
		{
			label: 'Draft',
			value: totals.draft ?? 0,
			icon: <IconFileText size={22} />,
			color: 'gray',
		},
		{
			label: 'Submitted',
			value: totals.submitted ?? 0,
			icon: <IconSend size={22} />,
			color: 'gray',
		},
		{
			label: 'Submitted & Paid',
			value: totals.submittedPaid ?? 0,
			icon: <IconCash size={22} />,
			color: 'green',
			highlight: true,
		},
	];

	return (
		<Group grow>
			{cards.map((card) => (
				<Paper key={card.label} withBorder p='md'>
					<Group justify='space-between' align='flex-start'>
						<Stack gap={4}>
							<Text size='xs' c='dimmed' tt='uppercase' fw={600}>
								{card.label}
							</Text>
							<Text
								color={card.highlight ? 'green.5' : 'default'}
								fw={700}
								size='xl'
							>
								{card.value.toLocaleString()}
							</Text>
						</Stack>
					</Group>
				</Paper>
			))}
		</Group>
	);
}
