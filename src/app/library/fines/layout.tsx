'use client';

import { Badge, Group, Select } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import type { PropsWithChildren } from 'react';
import { getFineStatusColor } from '@/shared/lib/utils/colors';
import { formatCurrency } from '@/shared/lib/utils/utils';
import { ListItem, ListLayout } from '@/shared/ui/adease';
import type { FineStatus } from './_lib/types';
import { getFines } from './_server/actions';

type FineListItem = {
	id: number;
	loanId: number;
	stdNo: number;
	amount: number;
	daysOverdue: number;
	status: FineStatus;
	createdAt: Date | null;
	paidAt: Date | null;
	studentName: string;
	bookTitle: string;
};

export default function FinesLayout({ children }: PropsWithChildren) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const statusFilter = (searchParams.get('status') as FineStatus) || undefined;

	async function fetchFines(page: number, search: string) {
		return getFines(page, search, statusFilter);
	}

	function handleStatusChange(value: string | null) {
		const params = new URLSearchParams(searchParams);
		if (value && value !== 'all') {
			params.set('status', value);
		} else {
			params.delete('status');
		}
		params.delete('page');
		router.push(`/library/fines?${params.toString()}`);
	}

	return (
		<ListLayout<FineListItem>
			path='/library/fines'
			queryKey={['fines', statusFilter || 'all']}
			getData={fetchFines}
			actionIcons={[
				<Select
					key='status-filter'
					size='xs'
					w={80}
					placeholder='Filter'
					value={statusFilter || 'all'}
					onChange={handleStatusChange}
					data={[
						{ value: 'all', label: 'All' },
						{ value: 'Unpaid', label: 'Unpaid' },
						{ value: 'Paid', label: 'Paid' },
					]}
				/>,
			]}
			renderItem={(fine) => (
				<ListItem
					id={fine.id}
					label={
						<Group gap='xs'>
							{fine.studentName}
							<Badge
								size='xs'
								variant='light'
								color={getFineStatusColor(fine.status)}
							>
								{fine.status}
							</Badge>
						</Group>
					}
					description={`${fine.bookTitle} • ${formatCurrency(fine.amount, 'M')}`}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
