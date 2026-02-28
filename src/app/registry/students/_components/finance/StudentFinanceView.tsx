'use client';

import {
	fetchStudentEstimates,
	fetchStudentFinance,
	fetchStudentPayments,
	fetchStudentSalesReceipts,
	resolveZohoContactId,
} from '@finance/_lib/zoho-books/actions';
import {
	Badge,
	Group,
	Paper,
	Skeleton,
	Stack,
	Tabs,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	IconAlertTriangle,
	IconCreditCard,
	IconFileInvoice,
	IconNotebook,
	IconReceipt,
} from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { EstimatesTab } from './EstimatesTab';
import { FinancialOverview } from './FinancialOverview';
import { InvoicesTab } from './InvoicesTab';
import { PaymentsTab } from './PaymentsTab';
import { SalesReceiptsTab } from './SalesReceiptsTab';

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

	if (!isActive) return null;

	if (contactLoading || summaryLoading) return <FinanceLoader />;

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

	if (!contactId || !summary) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' gap='md' py='lg'>
					<ThemeIcon size={56} variant='light' color='gray'>
						<IconFileInvoice size='1.6rem' />
					</ThemeIcon>
					<Stack align='center' gap={4}>
						<Text fw={600} size='lg'>
							No financial records
						</Text>
						<Text size='sm' c='dimmed' ta='center'>
							This student was not found in Zoho Books.
						</Text>
					</Stack>
				</Stack>
			</Paper>
		);
	}

	return (
		<Stack gap='lg'>
			<FinancialOverview
				summary={summary}
				isFetching={isFetching}
				onRefresh={() => {
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
				}}
			/>

			<Tabs value={tab} onChange={setTab}>
				<Tabs.List>
					<TabLabel
						value='invoices'
						icon={<IconFileInvoice size='0.85rem' />}
						label='Invoices'
						count={summary.invoices.length}
					/>
					<TabLabel
						value='payments'
						icon={<IconCreditCard size='0.85rem' />}
						label='Payments'
						count={payments?.length}
						loading={paymentsLoading}
					/>
					<TabLabel
						value='quotes'
						icon={<IconNotebook size='0.85rem' />}
						label='Quotes'
						count={estimates?.length}
						loading={estimatesLoading}
					/>
					<TabLabel
						value='receipts'
						icon={<IconReceipt size='0.85rem' />}
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
		</Stack>
	);
}

type TabLabelProps = {
	value: string;
	icon: React.ReactNode;
	label: string;
	count?: number;
	loading?: boolean;
};

function TabLabel({ value, icon, label, count, loading }: TabLabelProps) {
	return (
		<Tabs.Tab value={value} leftSection={icon}>
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

function FinanceLoader() {
	return (
		<Stack gap='md'>
			<Group justify='space-between'>
				<Skeleton height={12} width={120} />
				<Skeleton height={24} width={24} circle />
			</Group>
			<Group grow gap='sm'>
				{Array.from({ length: 3 }).map((_, i) => (
					<Paper p='md' withBorder key={`metric-${i}`}>
						<Stack gap='xs'>
							<Skeleton height={10} width={80} />
							<Skeleton height={22} width={100} />
						</Stack>
					</Paper>
				))}
			</Group>
			<Group gap='xs'>
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton height={30} width={90} key={`tab-${i}`} />
				))}
			</Group>
			<Paper withBorder p='sm'>
				<Stack gap='xs'>
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton height={36} key={`row-${i}`} />
					))}
				</Stack>
			</Paper>
		</Stack>
	);
}
