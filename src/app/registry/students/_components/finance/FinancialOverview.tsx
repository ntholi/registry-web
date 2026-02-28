import type { StudentFinanceSummary } from '@finance/_lib/zoho-books/types';
import {
	ActionIcon,
	Badge,
	Group,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	Tooltip,
} from '@mantine/core';
import {
	IconCheck,
	IconCoin,
	IconCreditCard,
	IconRefresh,
	IconWallet,
} from '@tabler/icons-react';
import { formatCurrency } from '@/shared/lib/utils/utils';

type Props = {
	summary: StudentFinanceSummary;
	isFetching: boolean;
	onRefresh: () => void;
};

export function FinancialOverview({ summary, isFetching, onRefresh }: Props) {
	const txCount =
		summary.invoices.length +
		summary.payments.length +
		summary.estimates.length +
		summary.salesReceipts.length +
		summary.creditNotes.length;

	return (
		<Paper p='lg' withBorder>
			<Stack gap='md'>
				<Group justify='space-between' align='flex-start' wrap='nowrap'>
					<Stack gap={2}>
						<Text size='xs' c='dimmed' tt='uppercase' fw={600} lts={0.5}>
							Financial Summary
						</Text>
					</Stack>

					<Group gap='xs'>
						<Badge
							variant='light'
							color={summary.totalOutstanding > 0 ? 'red' : 'green'}
						>
							{txCount} transaction{txCount !== 1 ? 's' : ''}
						</Badge>
						<Tooltip label='Refresh' withArrow>
							<ActionIcon
								variant='subtle'
								color='gray'
								size='sm'
								loading={isFetching}
								onClick={onRefresh}
							>
								<IconRefresh size='1rem' />
							</ActionIcon>
						</Tooltip>
					</Group>
				</Group>

				<Group gap='3rem'>
					<MetricItem
						label='Total Invoiced'
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
					{summary.unusedCredits > 0 && (
						<MetricItem
							label='Credits'
							value={formatCurrency(summary.unusedCredits)}
							icon={<IconCreditCard size='0.9rem' />}
							color='cyan'
						/>
					)}
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
