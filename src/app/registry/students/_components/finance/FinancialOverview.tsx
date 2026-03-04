import type { StudentFinanceSummary } from '@finance/_lib/zoho-books/types';
import {
	ActionIcon,
	Box,
	Card,
	Divider,
	Group,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Tooltip,
} from '@mantine/core';
import { IconExternalLink, IconRefresh, IconReport } from '@tabler/icons-react';
import { formatCurrency } from '@/shared/lib/utils/utils';

type Props = {
	summary: StudentFinanceSummary;
	isFetching: boolean;
	onRefresh: () => void;
	zohoUrl: string | null;
};

export function FinancialOverview({
	summary,
	isFetching,
	onRefresh,
	zohoUrl,
}: Props) {
	return (
		<Box>
			<Group justify='space-between' align='center'>
				<Group gap='xs'>
					<ThemeIcon size='sm' variant='transparent' color='dimmed'>
						<IconReport size='1rem' />
					</ThemeIcon>
					<Text size='xs' fw={700} c='dimmed' tt='uppercase' lts={1}>
						Financial Summary
					</Text>
				</Group>
				<Group gap={4}>
					{zohoUrl && (
						<Tooltip label='Open in Zoho Books' withArrow position='left'>
							<ActionIcon
								variant='subtle'
								color='gray'
								size='sm'
								component='a'
								href={zohoUrl}
								target='_blank'
								rel='noopener noreferrer'
							>
								<IconExternalLink size='0.9rem' />
							</ActionIcon>
						</Tooltip>
					)}
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
			</Group>

			<Divider mb={'md'} mt='xs' />

			<SimpleGrid cols={{ base: 1, xs: 2, sm: 4 }} spacing='xs'>
				<MetricCard
					label='Total Invoiced'
					value={formatCurrency(summary.totalAmount)}
					color='default'
				/>
				<MetricCard
					label='Amount Paid'
					value={formatCurrency(summary.totalPaid)}
					color='default'
				/>
				<MetricCard
					label='Outstanding'
					value={formatCurrency(summary.totalOutstanding)}
					color={summary.totalOutstanding > 0 ? 'red' : 'teal'}
				/>
				<MetricCard
					label='Unused Credits'
					value={formatCurrency(summary.unusedCredits)}
					color='default'
				/>
			</SimpleGrid>
		</Box>
	);
}

type MetricCardProps = {
	label: string;
	value: string;
	color: string;
};

function MetricCard({ label, value, color }: MetricCardProps) {
	return (
		<Card withBorder padding='sm'>
			<Group gap='sm' wrap='nowrap' align='center'>
				<Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
					<Text size='xs' c='dimmed' truncate>
						{label}
					</Text>
					<Text c={color} ff='monospace' lh={1.2}>
						{value}
					</Text>
				</Stack>
			</Group>
		</Card>
	);
}
