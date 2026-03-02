import type { StudentFinanceSummary } from '@finance/_lib/zoho-books/types';
import {
	ActionIcon,
	Card,
	Divider,
	Group,
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
	IconReport,
	IconWallet,
} from '@tabler/icons-react';
import { formatCurrency } from '@/shared/lib/utils/utils';

type Props = {
	summary: StudentFinanceSummary;
	isFetching: boolean;
	onRefresh: () => void;
};

export function FinancialOverview({ summary, isFetching, onRefresh }: Props) {
	return (
		<Stack gap='md'>
			<Group justify='space-between' align='center'>
				<Group gap='xs'>
					<ThemeIcon size='sm' variant='transparent' color='dimmed'>
						<IconReport size='1rem' />
					</ThemeIcon>
					<Text size='xs' fw={700} c='dimmed' tt='uppercase' lts={1}>
						Financial Summary
					</Text>
				</Group>
				<Tooltip label='Refresh from Zoho' withArrow position='left'>
					<ActionIcon
						variant='subtle'
						color='gray'
						size='sm'
						loading={isFetching}
						onClick={onRefresh}
					>
						<IconRefresh size='0.9rem' />
					</ActionIcon>
				</Tooltip>
			</Group>

			<Divider />

			<SimpleGrid cols={{ base: 1, xs: 2, sm: 4 }} spacing='sm'>
				<MetricCard
					label='Total Invoiced'
					value={formatCurrency(summary.totalAmount)}
					icon={<IconCoin size='1.2rem' />}
					color='violet'
				/>
				<MetricCard
					label='Amount Paid'
					value={formatCurrency(summary.totalPaid)}
					icon={<IconCheck size='1.2rem' />}
					color='teal'
				/>
				<MetricCard
					label='Outstanding'
					value={formatCurrency(summary.totalOutstanding)}
					icon={<IconWallet size='1.2rem' />}
					color={summary.totalOutstanding > 0 ? 'red' : 'teal'}
				/>
				{summary.unusedCredits > 0 && (
					<MetricCard
						label='Unused Credits'
						value={formatCurrency(summary.unusedCredits)}
						icon={<IconCreditCard size='1.2rem' />}
						color='cyan'
					/>
				)}
			</SimpleGrid>
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
		<Card withBorder padding='sm'>
			<Group gap='sm' wrap='nowrap' align='center'>
				<ThemeIcon
					size='lg'
					variant='light'
					color={color}
					style={{ flexShrink: 0 }}
				>
					{icon}
				</ThemeIcon>
				<Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
					<Text size='xs' c='dimmed' truncate>
						{label}
					</Text>
					<Text ff='monospace' lh={1.2}>
						{value}
					</Text>
				</Stack>
			</Group>
		</Card>
	);
}
