'use client';

import { Badge, Group } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import type { PropsWithChildren } from 'react';
import { getReservationStatusColor } from '@/shared/lib/utils/colors';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import ReservationStatusFilter from './_components/ReservationStatusFilter';
import type { ReservationFilters, ReservationStatus } from './_lib/types';
import { getReservations } from './_server/actions';

export default function ReservationsLayout({ children }: PropsWithChildren) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const statusFilter =
		(searchParams.get('status') as ReservationStatus) || undefined;

	async function fetchReservations(page: number, search: string) {
		const filters: ReservationFilters = {};
		if (statusFilter) filters.status = statusFilter;
		return getReservations(page, search, filters);
	}

	function handleStatusChange(value: string | null) {
		const params = new URLSearchParams(searchParams);
		if (value && value !== 'all') {
			params.set('status', value);
		} else {
			params.delete('status');
		}
		params.delete('page');
		router.push(`/library/reservations?${params.toString()}`);
	}

	return (
		<ListLayout
			path='/library/reservations'
			queryKey={['reservations', statusFilter || 'all']}
			getData={fetchReservations}
			actionIcons={[
				<ReservationStatusFilter
					key='status-filter'
					value={statusFilter || 'all'}
					onChange={handleStatusChange}
				/>,
				<NewLink key='new' href='/library/reservations/new' />,
			]}
			renderItem={(reservation) => {
				const isExpired =
					reservation.status === 'Active' &&
					reservation.isExpired !== undefined &&
					reservation.isExpired;
				const displayStatus = isExpired ? 'Expired' : reservation.status;

				return (
					<ListItem
						id={reservation.id}
						label={
							<Group gap='xs'>
								{reservation.book.title}
								<Badge
									size='xs'
									variant='light'
									color={getReservationStatusColor(displayStatus)}
								>
									{displayStatus}
								</Badge>
							</Group>
						}
						description={`${reservation.student.stdNo} | ${reservation.student.name}`}
					/>
				);
			}}
		>
			{children}
		</ListLayout>
	);
}
