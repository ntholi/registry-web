import type { StudentFinanceSummary } from '@finance/_lib/zoho-books/types';
import {
	ActionIcon,
	Group,
	Paper,
	Progress,
	SimpleGrid,
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
	const paidPct =
		summary.totalAmount > 0
			? Math.round((summary.totalPaid / summary.totalAmount) * 100)
			: 100;

	return (
		<Stack gap='sm'>
			<Group justify='space-between' align='center'>
				<Text size='sm' fw={600} c='dimmed' tt='uppercase' lts={0.5}>
					Financial Summary
				</Text>
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

			<SimpleGrid cols={{ base: 2, sm: 4 }} spacing='sm'>
				<MetricCard
					label='Total Invoiced'
					value={formatCurrency(summary.totalAmount)}
					icon={<IconCoin size='1.1rem' />}
					color='violet'
				/>
				<MetricCard
					label='Paid'
					value={formatCurrency(summary.totalPaid)}
					icon={<IconCheck size='1.1rem' />}
					color='green'
				/>
				<MetricCard
					label='Outstanding'
					value={formatCurrency(summary.totalOutstanding)}
					icon={<IconWallet size='1.1rem' />}
					color={summary.totalOutstanding > 0 ? 'red' : 'green'}
				/>
				{summary.unusedCredits > 0 && (
					<MetricCard
						label='Credits'
						value={formatCurrency(summary.unusedCredits)}
						icon={<IconCreditCard size='1.1rem' />}
						color='cyan'
					/>
				)}
			</SimpleGrid>

			<Paper p='xs' px='sm' withBorder radius='md'>
				<Group justify='space-between' mb={4}>
					<Text size='xs' c='dimmed'>
						Payment Progress
					</Text>
					<Text size='xs' fw={600}>
						{paidPct}%
					</Text>
				</Group>
				<Progress.Root size='sm' radius='xl'>
					<Progress.Section value={paidPct} color='green' />
					{summary.totalOutstanding > 0 && (
						<Progress.Section value={100 - paidPct} color='red.3' />
					)}
				</Progress.Root>
			</Paper>
		</Stack>
	);
}

type MetricCardProps = {
	label: string;
	value: string;
	icon: React.ReactNode;
	color: string;
};

function MetricCard({ label, value, icon, color }: MetricCardProps) {
	return (
		<Paper p='md' withBorder radius='md'>
			<Group gap='xs' mb='xs'>
				<ThemeIcon size='sm' variant='light' color={color} radius='xl'>
					{icon}
				</ThemeIcon>
				<Text size='xs' c='dimmed'>
					{label}
				</Text>
			</Group>
			<Text fw={700} size='lg' ff='monospace'>
				{value}
			</Text>
		</Paper>
	);
}
