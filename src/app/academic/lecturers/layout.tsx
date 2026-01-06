'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout } from '@/shared/ui/adease';
import { getLecturers } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/academic/lecturers'}
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
