import type { StudentInvoiceSummary } from '@finance/_lib/zoho-books/types';
import { Badge, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconCheck, IconCoin, IconWallet } from '@tabler/icons-react';
import { formatCurrency } from '@/shared/lib/utils/utils';

type Props = {
	summary: StudentInvoiceSummary;
};

export function FinancialOverview({ summary }: Props) {
	return (
		<Paper p='lg' withBorder>
			<Stack gap='md'>
				<Group justify='space-between' align='flex-start' wrap='nowrap'>
					<Stack gap={2}>
						<Text size='xs' c='dimmed' tt='uppercase' fw={600} lts={0.5}>
							Financial Summary
						</Text>
					</Stack>

					<Badge
						variant='light'
						color={summary.totalOutstanding > 0 ? 'red' : 'green'}
					>
						{summary.totalInvoices} invoice
						{summary.totalInvoices !== 1 ? 's' : ''}
					</Badge>
				</Group>

				<Group gap='3rem'>
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
