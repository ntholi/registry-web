'use client';

import { findAllGraduationRequests } from '@registry/graduation/clearance';
import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { getStatusIcon, type StatusType } from '@/shared/lib/utils/status';
import { ListItem, ListLayout } from '@/shared/ui/adease';
import GraduationRequestStatusFilter from './_components/GraduationRequestStatusFilter';

export default function Layout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();
	const status = searchParams.get('status') || 'all';

	return (
		<ListLayout
			path='/registry/graduation/requests'
			queryKey={['graduation-requests', searchParams.toString()]}
			actionIcons={[<GraduationRequestStatusFilter key='status-filter' />]}
			getData={async (page, search) => {
				const response = await findAllGraduationRequests(
					page,
					search,
					status !== 'all'
						? (status as 'pending' | 'approved' | 'rejected')
						: undefined
				);
				const items = response.data.map((item) => ({
					id: item.id,
					status: item.status,
					studentProgram: item.studentProgram,
					informationConfirmed: item.informationConfirmed,
				}));

				return {
					items,
					totalPages: response.pages,
				};
			}}
			renderItem={(it) => (
				<ListItem
					id={it.id}
					label={it.studentProgram.stdNo.toString()}
					description={it.studentProgram.student.name}
					rightSection={getStatusIcon(it.status as StatusType, {
						withColor: true,
					})}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
