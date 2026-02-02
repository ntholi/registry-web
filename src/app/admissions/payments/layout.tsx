'use client';

import { Badge, Group } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import type { PropsWithChildren } from 'react';
import { getDepositStatusColor } from '@/shared/lib/utils/colors';
import { ListItem, ListLayout } from '@/shared/ui/adease';
import DepositStatusFilter from './_components/DepositStatusFilter';
import type {
	BankDepositWithRelations,
	DepositFilters,
	DepositStatus,
} from './_lib/types';
import { getBankDeposits } from './_server/actions';

export default function PaymentsLayout({ children }: PropsWithChildren) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const statusFilter =
		(searchParams.get('status') as DepositStatus) || undefined;

	async function fetchDeposits(page: number, search: string) {
		const filters: DepositFilters = {};
		if (statusFilter) filters.status = statusFilter;
		return getBankDeposits(page, search, filters);
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
		<ListLayout<BankDepositWithRelations>
			path='/admissions/payments'
			queryKey={['bank-deposits', statusFilter || 'all']}
			getData={fetchDeposits}
			actionIcons={[
				<DepositStatusFilter
					key='status-filter'
					value={statusFilter || 'all'}
					onChange={handleStatusChange}
				/>,
			]}
			renderItem={(deposit) => (
				<ListItem
					id={deposit.id}
					label={
						<Group gap='xs'>
							{deposit.application?.applicant?.fullName || 'Unknown'}
							<Badge
								size='xs'
								variant='light'
								color={getDepositStatusColor(deposit.status)}
							>
								{deposit.status}
							</Badge>
						</Group>
					}
					description={`M ${deposit.amountDeposited || '0.00'} | ${deposit.reference}`}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
