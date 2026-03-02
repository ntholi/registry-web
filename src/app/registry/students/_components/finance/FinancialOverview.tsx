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
					icon={<IconCoin size='1rem' />}
					color='violet'
				/>
				<MetricCard
					label='Amount Paid'
					value={formatCurrency(summary.totalPaid)}
					icon={<IconCheck size='1rem' />}
					color='teal'
				/>
				<MetricCard
					label='Outstanding'
					value={formatCurrency(summary.totalOutstanding)}
					icon={<IconWallet size='1rem' />}
					color={summary.totalOutstanding > 0 ? 'red' : 'teal'}
				/>
				{summary.unusedCredits > 0 && (
					<MetricCard
						label='Unused Credits'
						value={formatCurrency(summary.unusedCredits)}
						icon={<IconCreditCard size='1rem' />}
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
		<Card withBorder padding='lg' radius='md'>
			<Stack gap='sm'>
				<Group justify='space-between' align='flex-start'>
					<Text
						size='xs'
						c='dimmed'
						tt='uppercase'
						fw={700}
						lts={0.8}
						style={{ lineHeight: 1.4 }}
					>
						{label}
					</Text>
					<ThemeIcon
						size='lg'
						variant='light'
						color={color}
						radius='md'
						style={{ flexShrink: 0 }}
					>
						{icon}
					</ThemeIcon>
				</Group>
				<Text
					fw={800}
					ff='monospace'
					lh={1}
					style={{
						fontSize: 'clamp(0.9rem, 2.5vw, 1.25rem)',
						wordBreak: 'break-all',
					}}
				>
					{value}
				</Text>
			</Stack>
		</Card>
	);
}
