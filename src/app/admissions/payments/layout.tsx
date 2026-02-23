'use client';

import { ThemeIcon } from '@mantine/core';
import { IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import type { PropsWithChildren } from 'react';
import { getDepositStatusColor } from '@/shared/lib/utils/colors';
import { ListItem, ListLayout } from '@/shared/ui/adease';
import DepositStatusFilter from './_components/DepositStatusFilter';
import type { DepositFilters, DepositStatus } from './_lib/types';
import { getBankDeposits } from './_server/actions';

type PaymentReviewItem = {
	id: string;
	status: DepositStatus;
	type: 'bank_deposit' | 'sales_receipt';
	reference: string;
	amountDeposited: string | null;
	applicationId: string | null;
	applicantId: string | null;
	applicantName: string | null;
	createdAt: Date | null;
};

export default function PaymentsLayout({ children }: PropsWithChildren) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const statusFilter =
		(searchParams.get('status') as DepositStatus | 'all' | null) || 'pending';

	async function fetchDeposits(page: number, search: string) {
		const filters: DepositFilters = {};
		if (statusFilter !== 'all') filters.status = statusFilter;
		return getBankDeposits(page, search, filters);
	}

	function handleStatusChange(value: string | null) {
		const params = new URLSearchParams(searchParams);
		if (value && value !== 'pending') {
			params.set('status', value);
		} else {
			params.delete('status');
		}
		params.delete('page');
		const query = params.toString();
		router.push(
			query ? `/admissions/payments?${query}` : '/admissions/payments'
		);
	}

	return (
		<ListLayout<PaymentReviewItem>
			path='/admissions/payments'
			queryKey={['payments-review', statusFilter]}
			getData={fetchDeposits}
			actionIcons={[
				<DepositStatusFilter
					key='status-filter'
					value={statusFilter}
					onChange={handleStatusChange}
				/>,
			]}
			renderItem={(deposit) => (
				<ListItem
					id={deposit.id}
					label={deposit.applicantName || 'Unknown'}
					description={`M ${deposit.amountDeposited || '0.00'} • ${deposit.reference}`}
					rightSection={
						<ThemeIcon
							variant='transparent'
							c={getDepositStatusColor(deposit.status)}
						>
							{getStatusIcon(deposit.status)}
						</ThemeIcon>
					}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}

function getStatusIcon(status: DepositStatus) {
	switch (status) {
		case 'pending':
			return <IconClock size='1rem' />;
		case 'verified':
			return <IconCheck size='1rem' />;
		case 'rejected':
			return <IconAlertCircle size='1rem' />;
	}
}
