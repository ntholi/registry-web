'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout } from '@/components/adease';
import { getLecturers } from '@/server/lecturers/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/dashboard/lecturers'}
			queryKey={['lecturers']}
			getData={getLecturers}
			renderItem={(it) => (
				<ListItem id={it.id} label={it.name} description={it.email} />
			)}
		>
			{children}
		</ListLayout>
	);
}
