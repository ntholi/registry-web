'use client';

import { findAllGraduationRequests } from '@registry/graduation/clearance';
import { useParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { getStatusIcon } from '@/shared/lib/utils/status';
import { ListItem, ListLayout } from '@/shared/ui/adease';

type Status = 'pending' | 'rejected' | 'approved';

const statusTitles = {
	pending: 'Pending Graduation Requests',
	rejected: 'Rejected Requests',
	approved: 'Approved Requests',
};

type GraduationRequestItem = {
	id: number;
	studentProgram: {
		stdNo: number;
		student: {
			name: string;
		};
		structure: {
			program: {
				name: string;
			};
		};
	};
	informationConfirmed: boolean;
};

export default function Layout({ children }: PropsWithChildren) {
	const params = useParams();
	const status = params.status as Status;

	if (!statusTitles[status]) {
		return <div>Invalid status: {status}</div>;
	}

	return (
		<ListLayout
			path={`/registry/graduation/requests/${status}`}
			queryKey={['graduation-requests', status]}
			getData={async (page, search) => {
				const response = await findAllGraduationRequests(page, search, status);
				return {
					items: response.data.map((item) => ({
						id: item.id,
						studentProgram: item.studentProgram,
						informationConfirmed: item.informationConfirmed,
					})),
					totalPages: response.pages,
				};
			}}
			renderItem={(it: GraduationRequestItem) => (
				<ListItem
					id={it.id}
					label={it.studentProgram.stdNo.toString()}
					description={`${it.studentProgram.student.name}`}
					rightSection={getStatusIcon(status)}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
