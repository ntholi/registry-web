'use client';

import type { PropsWithChildren } from 'react';
import { getLecturers } from '@/server/academic/lecturers/actions';
import { ListItem, ListLayout } from '@/shared/components/adease';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/lecturers'}
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
