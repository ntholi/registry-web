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
							{contactLoading || summaryLoading ? (
								<Skeleton height={20} width={100} />
							) : hasContact ? (
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
								{zohoUrl && (
									<HoverCard position='bottom' withArrow>
										<HoverCard.Target>
											<ActionIcon
												variant='light'
												size='lg'
												color='blue'
												component='a'
												href={zohoUrl}
												target='_blank'
												rel='noopener noreferrer'
											>
												<IconExternalLink size={18} />
											</ActionIcon>
										</HoverCard.Target>
										<HoverCard.Dropdown p='xs'>
											<Text size='xs'>Open in Zoho Books</Text>
										</HoverCard.Dropdown>
									</HoverCard>
								)}
								<HoverCard position='bottom' withArrow>
									<HoverCard.Target>
										<ActionIcon
											variant='light'
											size='lg'
											color='teal'
											loading={isFetching}
											onClick={handleRefresh}
										>
											<IconRefresh size={18} />
										</ActionIcon>
									</HoverCard.Target>
									<HoverCard.Dropdown p='xs'>
										<Text size='xs'>Refresh financial data</Text>
									</HoverCard.Dropdown>
								</HoverCard>
							</>
						) : (
							!contactLoading &&
							!summaryLoading && <CreateContactBtn stdNo={stdNo} />
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
							color={summary.totalOutstanding > 0 ? 'red' : 'teal'}
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
	return (
		<Card withBorder padding='sm'>
			<Stack gap={2}>
				<Text size='xs' c='dimmed' truncate>
					{label}
				</Text>
				<Text c={color} ff='monospace' lh={1.2}>
					{value}
				</Text>
			</Stack>
		</Card>
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

function TabContent({ loading, children }: TabContentProps) {
	if (loading) {
		return (
			<Stack gap='xs'>
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton height={36} key={`loading-row-${i}`} />
				))}
			</Stack>
		);
	}
	return <>{children}</>;
}
