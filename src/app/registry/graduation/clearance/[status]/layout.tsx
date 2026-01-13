'use client';

import { graduationClearanceByStatus } from '@registry/graduation/clearance';
import { getLatestGraduationDate } from '@registry/graduation/dates';
import { IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { useParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { ListItem, ListLayout } from '@/shared/ui/adease';
import { selectedGraduationDateAtom } from '@/shared/ui/atoms/graduationAtoms';
import GraduationDateFilter from '@/shared/ui/GraduationDateFilter';

type Status = 'pending' | 'approved' | 'rejected';

type GraduationClearanceItem = {
	id: number;
	status: Status;
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

const statusTitles = {
	pending: 'Pending Graduation Clearance Requests',
	approved: 'Approved Graduation Clearances',
	rejected: 'Rejected Graduation Clearances',
};

export default function Layout({ children }: PropsWithChildren) {
	const params = useParams();
	const status = params.status as Status;
	const [selectedDate, setSelectedDate] = useAtom(selectedGraduationDateAtom);

	const { data: latestDate } = useQuery({
		queryKey: ['latest-graduation-date'],
		queryFn: getLatestGraduationDate,
		staleTime: 5 * 60 * 1000,
	});

	if (latestDate?.id && !selectedDate) {
		setSelectedDate(latestDate.id);
	}

	if (!statusTitles[status]) {
		return <div>Invalid status: {status}</div>;
	}

	return (
		<ListLayout
			path={`/registry/graduation/clearance/${status}`}
			queryKey={[
				'graduation-clearances',
				status,
				selectedDate?.toString() || latestDate?.id?.toString() || 'all',
			]}
			getData={async (page, search) => {
				const dateToUse = selectedDate || latestDate?.id;
				const response = await graduationClearanceByStatus(
					status,
					page,
					search,
					dateToUse || undefined
				);
				return {
					items: response.items || [],
					totalPages: response.totalPages || 1,
				};
			}}
			actionIcons={[
				<GraduationDateFilter
					key='graduation-date-filter'
					onDateChange={setSelectedDate}
				/>,
			]}
			renderItem={(it: GraduationClearanceItem) => (
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
