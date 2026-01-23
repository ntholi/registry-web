'use client';

import { Badge, Group } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import type { PropsWithChildren } from 'react';
import { getTransactionStatusColor } from '@/shared/lib/utils/colors';
import { ListItem, ListLayout } from '@/shared/ui/adease';
import PaymentStatusFilter from './_components/PaymentStatusFilter';
import type {
	PaymentFilters,
	PaymentWithRelations,
	TransactionStatus,
} from './_lib/types';
import { getPayments } from './_server/actions';

export default function PaymentsLayout({ children }: PropsWithChildren) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const statusFilter =
		(searchParams.get('status') as TransactionStatus) || undefined;

	async function fetchPayments(page: number, search: string) {
		const filters: PaymentFilters = {};
		if (statusFilter) filters.status = statusFilter;
		return getPayments(page, search, filters);
	}

	function handleStatusChange(value: string | null) {
		const params = new URLSearchParams(searchParams);
		if (value && value !== 'all') {
			params.set('status', value);
		} else {
			params.delete('status');
		}
		params.delete('page');
		router.push(`/admissions/payments?${params.toString()}`);
	}

	return (
		<ListLayout<PaymentWithRelations>
			path='/admissions/payments'
			queryKey={['payments', statusFilter || 'all']}
			getData={fetchPayments}
			actionIcons={[
				<PaymentStatusFilter
					key='status-filter'
					value={statusFilter || 'all'}
					onChange={handleStatusChange}
				/>,
			]}
			renderItem={(payment) => (
				<ListItem
					id={payment.id}
					label={
						<Group gap='xs'>
							{payment.applicant.fullName}
							<Badge
								size='xs'
								variant='light'
								color={getTransactionStatusColor(payment.status)}
							>
								{payment.status}
							</Badge>
						</Group>
					}
					description={`M ${payment.amount} | ${payment.mobileNumber}`}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
