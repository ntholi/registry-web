'use client';

import {
	fetchStudentEstimates,
	fetchStudentFinance,
	fetchStudentPayments,
	fetchStudentSalesReceipts,
	getZohoContactUrl,
	resolveZohoContactId,
} from '@finance/_lib/zoho-books/actions';
import {
	ActionIcon,
	Badge,
	Card,
	Group,
	HoverCard,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Tabs,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	IconAlertTriangle,
	IconExternalLink,
	IconRefresh,
} from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { formatCurrency } from '@/shared/lib/utils/utils';
import CreateContactBtn from './CreateContactBtn';
import { EstimatesTab } from './EstimatesTab';
import { InvoicesTab } from './InvoicesTab';
import { PaymentsTab } from './PaymentsTab';
import { SalesReceiptsTab } from './SalesReceiptsTab';
import { UpdateZohoContactModal } from './UpdateZohoContactModal';

type Props = {
	stdNo: number;
	zohoContactId: string | null;
	isActive: boolean;
};

export default function StudentFinanceView({
	stdNo,
	zohoContactId,
	isActive,
}: Props) {
	const [tab, setTab] = useState<string | null>('invoices');
	const queryClient = useQueryClient();

	const {
		data: contactId,
		isLoading: contactLoading,
		isError: contactError,
		error: contactErr,
	} = useQuery({
		queryKey: ['zoho-contact', stdNo],
		queryFn: () => resolveZohoContactId(stdNo, zohoContactId),
		enabled: isActive,
		staleTime: Number.POSITIVE_INFINITY,
	});

	const {
		data: summary,
		isLoading: summaryLoading,
		isError: summaryError,
		error: summaryErr,
		isFetching,
	} = useQuery({
		queryKey: ['student-finance', contactId],
		queryFn: () => fetchStudentFinance(contactId!),
		enabled: !!contactId,
		staleTime: 1000 * 60 * 5,
	});

	const { data: payments, isLoading: paymentsLoading } = useQuery({
		queryKey: ['student-payments', contactId],
		queryFn: () => fetchStudentPayments(contactId!),
		enabled: !!contactId,
		staleTime: 1000 * 60 * 5,
	});

	const { data: estimates, isLoading: estimatesLoading } = useQuery({
		queryKey: ['student-estimates', contactId],
		queryFn: () => fetchStudentEstimates(contactId!),
		enabled: !!contactId,
		staleTime: 1000 * 60 * 5,
	});

	const { data: salesReceipts, isLoading: receiptsLoading } = useQuery({
		queryKey: ['student-receipts', contactId],
		queryFn: () => fetchStudentSalesReceipts(contactId!),
		enabled: !!contactId,
		staleTime: 1000 * 60 * 5,
	});

	const { data: zohoUrl } = useQuery({
		queryKey: ['zoho-contact-url', contactId],
		queryFn: () => getZohoContactUrl(contactId!),
		enabled: !!contactId,
		staleTime: Number.POSITIVE_INFINITY,
	});

	if (!isActive) return null;

	if (contactLoading || summaryLoading) return <FinanceSkeleton />;

	const isError = contactError || summaryError;
	const error = contactErr || summaryErr;

	if (isError) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' gap='md' py='lg'>
					<ThemeIcon size={56} variant='light' color='red'>
						<IconAlertTriangle size='1.6rem' />
					</ThemeIcon>
					<Stack align='center' gap={4}>
						<Text fw={600} size='lg'>
							Unable to load financial data
						</Text>
						<Text size='sm' c='dimmed' ta='center' maw={360}>
							{error instanceof Error
								? error.message
								: 'Could not connect to Zoho Books. Please try again later.'}
						</Text>
					</Stack>
				</Stack>
			</Paper>
		);
	}

	const hasContact = !!contactId && !!summary;

	const handleRefresh = () => {
		queryClient.invalidateQueries({
			queryKey: ['student-finance', contactId],
		});
		queryClient.invalidateQueries({
			queryKey: ['student-payments', contactId],
		});
		queryClient.invalidateQueries({
			queryKey: ['student-estimates', contactId],
		});
		queryClient.invalidateQueries({
			queryKey: ['student-receipts', contactId],
		});
	};

	return (
		<Stack>
			<Card withBorder p='md'>
				<Group justify='space-between' align='center'>
					<Stack gap={4}>
						<Group gap='xs'>
							{hasContact ? (
								<Text fw={500} size='sm'>
									Zoho Books
								</Text>
							) : (
								<Text size='xs' c='dimmed' fs='italic'>
									(No Zoho contact)
								</Text>
							)}
						</Group>
						<Text size='xs' c='dimmed'>
							Zoho Books financial records and invoicing
						</Text>
					</Stack>
					<Group gap='xs'>
						{hasContact ? (
							<>
								<UpdateZohoContactModal stdNo={stdNo} contactId={contactId} />
								<HoverCard position='bottom' withArrow>
									<HoverCard.Target>
										<ActionIcon
											variant='light'
											color='teal'
											loading={isFetching}
											onClick={handleRefresh}
										>
											<IconRefresh size={16} />
										</ActionIcon>
									</HoverCard.Target>
									<HoverCard.Dropdown p='xs'>
										<Text size='xs'>Refetch from Zoho</Text>
									</HoverCard.Dropdown>
								</HoverCard>
								<HoverCard position='bottom' withArrow>
									<HoverCard.Target>
										<ActionIcon
											variant='light'
											color='blue'
											component='a'
											href={zohoUrl}
											target='_blank'
											rel='noopener noreferrer'
										>
											<IconExternalLink size={16} />
										</ActionIcon>
									</HoverCard.Target>
									<HoverCard.Dropdown p='xs'>
										<Text size='xs'>Open in Zoho Books</Text>
									</HoverCard.Dropdown>
								</HoverCard>
							</>
						) : (
							<CreateContactBtn stdNo={stdNo} />
						)}
					</Group>
				</Group>
			</Card>

			{hasContact && (
				<>
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
							color={summary.totalOutstanding > 0 ? 'red' : 'green'}
						/>
						<MetricCard
							label='Unused Credits'
							value={formatCurrency(summary.unusedCredits)}
							color='default'
						/>
					</SimpleGrid>

					<Tabs value={tab} onChange={setTab} variant='default'>
						<Tabs.List>
							<TabLabel
								value='invoices'
								label='Invoices'
								count={summary.invoices.length}
							/>
							<TabLabel
								value='payments'
								label='Payments'
								count={payments?.length}
								loading={paymentsLoading}
							/>
							<TabLabel
								value='quotes'
								label='Quotes'
								count={estimates?.length}
								loading={estimatesLoading}
							/>
							<TabLabel
								value='receipts'
								label='Receipts'
								count={salesReceipts?.length}
								loading={receiptsLoading}
							/>
						</Tabs.List>

						<Tabs.Panel value='invoices' pt='md'>
							<InvoicesTab invoices={summary.invoices} />
						</Tabs.Panel>
						<Tabs.Panel value='payments' pt='md'>
							<TabContent loading={paymentsLoading}>
								<PaymentsTab payments={payments ?? []} />
							</TabContent>
						</Tabs.Panel>
						<Tabs.Panel value='quotes' pt='md'>
							<TabContent loading={estimatesLoading}>
								<EstimatesTab estimates={estimates ?? []} />
							</TabContent>
						</Tabs.Panel>
						<Tabs.Panel value='receipts' pt='md'>
							<TabContent loading={receiptsLoading}>
								<SalesReceiptsTab receipts={salesReceipts ?? []} />
							</TabContent>
						</Tabs.Panel>
					</Tabs>
				</>
			)}
		</Stack>
	);
}

type MetricCardProps = {
	label: string;
	value: string;
	color: string;
};

function MetricCard({ label, value, color }: MetricCardProps) {
	const accented = color !== 'default';
	return (
		<Paper withBorder p='sm'>
			<Group gap='xs'>
				<Stack gap={3}>
					<Text size='xs' c='dimmed' fw={500}>
						{label}
					</Text>
					<Text c={accented ? color : undefined} ff='monospace'>
						{value}
					</Text>
				</Stack>
			</Group>
		</Paper>
	);
}

type TabLabelProps = {
	value: string;
	label: string;
	count?: number;
	loading?: boolean;
};

function TabLabel({ value, label, count, loading }: TabLabelProps) {
	return (
		<Tabs.Tab value={value}>
			<Group gap={6} wrap='nowrap'>
				<Text size='sm' inherit>
					{label}
				</Text>
				{loading ? (
					<Skeleton height={16} width={16} circle />
				) : (
					count != null &&
					count > 0 && (
						<Badge size='xs' variant='default' circle>
							{count}
						</Badge>
					)
				)}
			</Group>
		</Tabs.Tab>
	);
}

type TabContentProps = {
	loading: boolean;
	children: React.ReactNode;
};

const TAB_CONTENT_ROWS = ['tc0', 'tc1', 'tc2', 'tc3'] as const;

function TabContent({ loading, children }: TabContentProps) {
	if (loading) {
		return (
			<Stack gap='xs'>
				{TAB_CONTENT_ROWS.map((id) => (
					<Skeleton height={36} key={id} />
				))}
			</Stack>
		);
	}
	return <>{children}</>;
}

const SKELETON_METRICS = [
	{ id: 'total', w: 96 },
	{ id: 'paid', w: 80 },
	{ id: 'outstanding', w: 88 },
	{ id: 'credits', w: 76 },
] as const;

const SKELETON_TABS = [
	{ id: 'inv', w: 56 },
	{ id: 'pay', w: 64 },
	{ id: 'quo', w: 48 },
	{ id: 'rec', w: 60 },
] as const;

const SKELETON_COLS = [
	{ id: 'no', w: 88 },
	{ id: 'date', w: 68 },
	{ id: 'due', w: 68 },
	{ id: 'amt', w: 80 },
] as const;

const SKELETON_ROWS = ['r0', 'r1', 'r2', 'r3', 'r4', 'r5'] as const;

function FinanceSkeleton() {
	return (
		<Stack>
			<Card withBorder p='md'>
				<Group justify='space-between' align='center'>
					<Stack gap={5}>
						<Skeleton height={14} width={110} />
						<Skeleton height={11} width={230} />
					</Stack>
					<Group gap='xs'>
						<Skeleton height={34} width={90} radius='sm' />
						<Skeleton height={34} width={34} radius='sm' />
						<Skeleton height={34} width={34} radius='sm' />
					</Group>
				</Group>
			</Card>

			<SimpleGrid cols={{ base: 1, xs: 2, sm: 4 }} spacing='xs'>
				{SKELETON_METRICS.map(({ id, w }) => (
					<Paper withBorder p='sm' key={id}>
						<Stack gap={6}>
							<Skeleton height={10} width={w} />
							<Skeleton height={22} width={100} />
						</Stack>
					</Paper>
				))}
			</SimpleGrid>

			<Stack gap={0}>
				<Group gap={0}>
					{SKELETON_TABS.map(({ id, w }) => (
						<Group key={id} gap={6} px='md' py='sm'>
							<Skeleton height={13} width={w} />
							<Skeleton height={16} width={16} circle />
						</Group>
					))}
				</Group>
				<Skeleton height={1} width='100%' />

				<Stack gap='xs' pt='md'>
					<Group gap='md' px='xs'>
						{SKELETON_COLS.map(({ id, w }) => (
							<Skeleton key={id} height={11} width={w} />
						))}
						<Skeleton height={11} width={52} />
					</Group>
					<Skeleton height={1} width='100%' />
					{SKELETON_ROWS.map((id) => (
						<Group key={id} gap='md' px='xs' py={3}>
							{SKELETON_COLS.map(({ id: cid, w }) => (
								<Skeleton key={cid} height={14} width={w} />
							))}
							<Skeleton height={20} width={58} radius='xl' />
						</Group>
					))}
				</Stack>
			</Stack>
		</Stack>
	);
}
