'use client';

import { fetchStudentFinance } from '@finance/_lib/zoho-books/actions';
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
	IconReceiptRefund,
} from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CreditNotesTab } from './CreditNotesTab';
import { EstimatesTab } from './EstimatesTab';
import { FinancialOverview } from './FinancialOverview';
import { InvoicesTab } from './InvoicesTab';
import { PaymentsTab } from './PaymentsTab';
import { SalesReceiptsTab } from './SalesReceiptsTab';

type Props = {
	stdNo: number;
	isActive: boolean;
};

export default function StudentFinanceView({ stdNo, isActive }: Props) {
	const [tab, setTab] = useState<string | null>('invoices');
	const queryClient = useQueryClient();

	const {
		data: summary,
		isLoading,
		isError,
		error,
		isFetching,
	} = useQuery({
		queryKey: ['student-finance', stdNo],
		queryFn: () => fetchStudentFinance(stdNo),
		enabled: isActive,
		staleTime: 1000 * 60 * 5,
	});

	if (!isActive) return null;

	if (isLoading) return <FinanceLoader />;

	if (isError) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' gap='md' py='lg'>
					<ThemeIcon size={56} variant='light' color='red' radius='xl'>
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

	if (!summary) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' gap='md' py='lg'>
					<ThemeIcon size={56} variant='light' color='gray' radius='xl'>
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
				onRefresh={() =>
					queryClient.invalidateQueries({
						queryKey: ['student-finance', stdNo],
					})
				}
			/>

			<Tabs value={tab} onChange={setTab} variant='pills' radius='md'>
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
						count={summary.payments.length}
					/>
					<TabLabel
						value='quotes'
						icon={<IconNotebook size='0.85rem' />}
						label='Quotes'
						count={summary.estimates.length}
					/>
					<TabLabel
						value='receipts'
						icon={<IconReceipt size='0.85rem' />}
						label='Receipts'
						count={summary.salesReceipts.length}
					/>
					<TabLabel
						value='credits'
						icon={<IconReceiptRefund size='0.85rem' />}
						label='Credits'
						count={summary.creditNotes.length}
					/>
				</Tabs.List>

				<Tabs.Panel value='invoices' pt='md'>
					<InvoicesTab invoices={summary.invoices} />
				</Tabs.Panel>
				<Tabs.Panel value='payments' pt='md'>
					<PaymentsTab payments={summary.payments} />
				</Tabs.Panel>
				<Tabs.Panel value='quotes' pt='md'>
					<EstimatesTab estimates={summary.estimates} />
				</Tabs.Panel>
				<Tabs.Panel value='receipts' pt='md'>
					<SalesReceiptsTab receipts={summary.salesReceipts} />
				</Tabs.Panel>
				<Tabs.Panel value='credits' pt='md'>
					<CreditNotesTab creditNotes={summary.creditNotes} />
				</Tabs.Panel>
			</Tabs>
		</Stack>
	);
}

type TabLabelProps = {
	value: string;
	icon: React.ReactNode;
	label: string;
	count: number;
};

function TabLabel({ value, icon, label, count }: TabLabelProps) {
	return (
		<Tabs.Tab value={value} leftSection={icon}>
			<Group gap={6} wrap='nowrap'>
				<Text size='sm' inherit>
					{label}
				</Text>
				{count > 0 && (
					<Badge size='xs' variant='default' circle>
						{count}
					</Badge>
				)}
			</Group>
		</Tabs.Tab>
	);
}

function FinanceLoader() {
	return (
		<Stack gap='md'>
			<Group justify='space-between'>
				<Skeleton height={12} width={120} radius='xl' />
				<Skeleton height={24} width={24} circle />
			</Group>
			<Group grow gap='sm'>
				{Array.from({ length: 3 }).map((_, i) => (
					<Paper p='md' withBorder radius='md' key={`metric-${i}`}>
						<Stack gap='xs'>
							<Skeleton height={10} width={80} radius='xl' />
							<Skeleton height={22} width={100} radius='xl' />
						</Stack>
					</Paper>
				))}
			</Group>
			<Skeleton height={6} radius='xl' />
			<Group gap='xs'>
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton height={30} width={90} radius='md' key={`tab-${i}`} />
				))}
			</Group>
			<Paper withBorder radius='md' p='sm'>
				<Stack gap='xs'>
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton height={36} radius='sm' key={`row-${i}`} />
					))}
				</Stack>
			</Paper>
		</Stack>
	);
}
