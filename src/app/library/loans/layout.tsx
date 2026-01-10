'use client';

import { Badge, Group, Select } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import type { PropsWithChildren } from 'react';
import { getLoanStatusColor } from '@/shared/lib/utils/colors';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import type { LoanFilters, LoanStatus } from './_lib/types';
import { getLoans } from './_server/actions';

export default function LoansLayout({ children }: PropsWithChildren) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const statusFilter = (searchParams.get('status') as LoanStatus) || undefined;

	async function fetchLoans(page: number, search: string) {
		const filters: LoanFilters = {};
		if (statusFilter) filters.status = statusFilter;
		return getLoans(page, search, filters);
	}

	function handleStatusChange(value: string | null) {
		const params = new URLSearchParams(searchParams);
		if (value && value !== 'all') {
			params.set('status', value);
		} else {
			params.delete('status');
		}
		params.delete('page');
		router.push(`/library/loans?${params.toString()}`);
	}

	return (
		<ListLayout
			path='/library/loans'
			queryKey={['loans', statusFilter || 'all']}
			getData={fetchLoans}
			actionIcons={[
				<Select
					key='status-filter'
					size='xs'
					w={120}
					placeholder='Filter'
					value={statusFilter || 'all'}
					onChange={handleStatusChange}
					data={[
						{ value: 'all', label: 'All' },
						{ value: 'Active', label: 'Active' },
						{ value: 'Overdue', label: 'Overdue' },
						{ value: 'Returned', label: 'Returned' },
					]}
				/>,
				<NewLink key='new' href='/library/loans/new' />,
			]}
			renderItem={(loan) => {
				const isOverdue =
					loan.status === 'Active' &&
					loan.daysOverdue !== undefined &&
					loan.daysOverdue > 0;
				const displayStatus = isOverdue ? 'Overdue' : loan.status;

				return (
					<ListItem
						id={loan.id}
						label={
							<Group gap='xs'>
								{loan.bookCopy.book.title}
								<Badge
									size='xs'
									variant='light'
									color={getLoanStatusColor(displayStatus)}
								>
									{displayStatus}
								</Badge>
							</Group>
						}
						description={loan.student.name}
					/>
				);
			}}
		>
			{children}
		</ListLayout>
	);
}
