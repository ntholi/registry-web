'use client';

import { getAllLecturersForList } from '@timetable/lecturer-allocations';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout } from '@/shared/ui/adease';

type LecturerItem = {
	userId: string;
	user: {
		name: string;
		email: string;
	} | null;
};

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/lecturer-allocations'}
			queryKey={['lecturer-allocations']}
			getData={getAllLecturersForList}
			renderItem={(it: LecturerItem) => (
				<ListItem
					id={it.userId}
					label={it.user?.name || 'Unknown Lecturer'}
					description={it.user?.email}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
