'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/components/adease';
import { getBlockedStudentByStatus } from '@/server/blocked-students/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/dashboard/blocked-students'}
			queryKey={['blocked-students']}
			getData={async (page, search) =>
				await getBlockedStudentByStatus('blocked', page, search)
			}
			actionIcons={[
				<NewLink key={'new-link'} href='/dashboard/blocked-students/new' />,
			]}
			renderItem={(it) => (
				<ListItem id={it.id} label={it.stdNo} description={it.student.name} />
			)}
		>
			{children}
		</ListLayout>
	);
}
