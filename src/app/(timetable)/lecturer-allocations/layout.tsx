'use client';

import { getAllLecturerAllocations } from '@timetable/lecturer-allocations';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/lecturer-allocations'}
			queryKey={['lecturer-allocations']}
			getData={async () => {
				const allocations = await getAllLecturerAllocations();
				return {
					items: allocations,
					count: allocations.length,
					totalPages: 1,
					page: 1,
				};
			}}
			actionIcons={[
				<NewLink key='new-link' href='/lecturer-allocations/new' />,
			]}
			renderItem={(it) => (
				<ListItem
					id={it.id}
					label={`${it.user?.name || 'Unknown'} - ${it.term?.name || 'Unknown Term'}`}
					description={`${it.semesterModule?.module?.code || 'Unknown Module'}`}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
