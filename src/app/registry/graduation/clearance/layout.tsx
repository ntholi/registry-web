'use client';

import { graduationClearanceByStatus } from '@registry/graduation/clearance';
import { getLatestGraduationDate } from '@registry/graduation/dates';
import { IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import type { PropsWithChildren } from 'react';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { ListItem, ListLayout } from '@/shared/ui/adease';
import { selectedGraduationDateAtom } from '@/shared/ui/atoms/graduationAtoms';
import GraduationDateFilter from '@/shared/ui/GraduationDateFilter';

type Status = 'pending' | 'approved' | 'rejected' | 'all';

type GraduationClearanceItem = {
	id: number;
	status: 'pending' | 'approved' | 'rejected';
	graduationRequest: {
		studentProgram: {
			stdNo: number;
			student: {
				stdNo: number;
				name: string;
			};
		};
	} | null;
};

export default function Layout({ children }: PropsWithChildren) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const statusFilter = (searchParams.get('status') || 'pending') as Status;
	const [selectedDate, setSelectedDate] = useAtom(selectedGraduationDateAtom);

	const { data: latestDate } = useQuery({
		queryKey: ['latest-graduation-date'],
		queryFn: getLatestGraduationDate,
		staleTime: 5 * 60 * 1000,
	});

	if (latestDate?.id && !selectedDate) {
		setSelectedDate(latestDate.id);
	}

	function handleStatusChange(status: string) {
		const params = new URLSearchParams(searchParams);
		if (status !== 'pending') {
			params.set('status', status);
		} else {
			params.delete('status');
		}
		params.delete('page');
		const query = params.toString();
		router.push(
			query
				? `/registry/graduation/clearance?${query}`
				: '/registry/graduation/clearance'
		);
	}

	return (
		<ListLayout<GraduationClearanceItem>
			path='/registry/graduation/clearance'
			queryKey={[
				'graduation-clearances',
				statusFilter,
				selectedDate?.toString() || latestDate?.id?.toString() || 'all',
			]}
			getData={async (page, search) => {
				const dateToUse = selectedDate || latestDate?.id;
				const effectiveStatus =
					search && statusFilter !== 'all'
						? undefined
						: statusFilter === 'all'
							? undefined
							: statusFilter;
				const response = await graduationClearanceByStatus(
					effectiveStatus,
					page,
					search,
					dateToUse || undefined
				);
				return {
					items: response.items || [],
					totalPages: response.totalPages || 1,
					totalItems: response.totalItems ?? 0,
				};
			}}
			actionIcons={[
				<GraduationDateFilter
					key='graduation-date-filter'
					statusValue={statusFilter}
					onStatusChange={handleStatusChange}
					onDateChange={setSelectedDate}
				/>,
			]}
			renderItem={(it) => (
				<ListItem
					id={it.id}
					label={
						it.graduationRequest?.studentProgram.stdNo || 'Unknown Student'
					}
					description={it.graduationRequest?.studentProgram.student.name}
					rightSection={getStatusIcon(it.status)}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}

function getStatusIcon(status: 'pending' | 'approved' | 'rejected') {
	const color = getStatusColor(status);
	switch (status) {
		case 'pending':
			return <IconClock size={'1rem'} color={color} />;
		case 'approved':
			return <IconCheck size={'1rem'} color={color} />;
		case 'rejected':
			return <IconAlertCircle size={'1rem'} color={color} />;
	}
}
