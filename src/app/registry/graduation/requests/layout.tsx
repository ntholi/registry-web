'use client';

import { findAllGraduationRequests } from '@registry/graduation/clearance';
import type { PropsWithChildren } from 'react';
import { getStatusIcon, type StatusType } from '@/shared/lib/utils/status';
import { ListItem, ListLayout } from '@/shared/ui/adease';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path='/registry/graduation/requests'
			queryKey={['graduation-requests']}
			getData={async (page, search) => {
				const response = await findAllGraduationRequests(page, search);
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
					rightSection={getStatusIcon(it.status as StatusType, { withColor: true })}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
