'use client';

import { getUniqueLecturers } from '@timetable/lecturer-allocations';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/lecturer-allocations'}
			queryKey={['lecturer-allocations']}
			getData={async () => {
				const lecturers = await getUniqueLecturers();
				return {
					items: lecturers,
					count: lecturers.length,
					totalPages: 1,
					page: 1,
				};
			}}
			actionIcons={[
				<NewLink key='new-link' href='/lecturer-allocations/new' />,
			]}
			renderItem={(it) => (
				<ListItem
					id={it.userId}
					label={it.user?.name || 'Unknown Lecturer'}
					description={it.user?.email || ''}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
