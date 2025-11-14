'use client';

import { graduationClearanceByStatus } from '@registry/graduation/clearance';
import { IconAlertCircle, IconCheck, IconClock } from '@tabler/icons-react';
import { useParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout } from '@/shared/ui/adease';

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

	if (!statusTitles[status]) {
		return <div>Invalid status: {status}</div>;
	}

	return (
		<ListLayout
			path={`/graduation/clearance/${status}`}
			queryKey={['graduation-clearances', status]}
			getData={async (page, search) => {
				const response = await graduationClearanceByStatus(
					status,
					page,
					search
				);
				return {
					items: response.items || [],
					totalPages: response.totalPages || 1,
				};
			}}
			actionIcons={[]}
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
	switch (status) {
		case 'pending':
			return <IconClock size={'1rem'} color='orange' />;
		case 'approved':
			return <IconCheck size={'1rem'} color='green' />;
		case 'rejected':
			return <IconAlertCircle size={'1rem'} color='red' />;
	}
}
