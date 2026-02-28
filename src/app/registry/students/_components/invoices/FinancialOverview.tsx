import type { StudentInvoiceSummary } from '@finance/_lib/zoho-books/types';
import {
	Badge,
	Group,
	Paper,
	RingProgress,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { IconCheck, IconCoin, IconWallet } from '@tabler/icons-react';
import { formatCurrency } from '@/shared/lib/utils/utils';

type FinancialOverviewProps = {
	summary: StudentInvoiceSummary;
};

export function FinancialOverview({ summary }: FinancialOverviewProps) {
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
