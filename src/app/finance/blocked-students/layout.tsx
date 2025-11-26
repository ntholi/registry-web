'use client';

import { getBlockedStudentByStatus } from '@finance/blocked-students';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/finance/blocked-students'}
			queryKey={['blocked-students']}
			getData={async (page, search) =>
				await getBlockedStudentByStatus('blocked', page, search)
			}
			actionIcons={[<NewLink key={'new-link'} href='/finance/blocked-students/new' />]}
			renderItem={(it) => (
				<ListItem id={it.id} label={it.stdNo} description={it.student.name} />
			)}
		>
			{children}
		</ListLayout>
	);
}
