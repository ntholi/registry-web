'use client';

import type { PropsWithChildren } from 'react';
import { getBlockedStudentByStatus } from '@/modules/finance/features/blocked-students/server/actions';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/blocked-students'}
			queryKey={['blocked-students']}
			getData={async (page, search) =>
				await getBlockedStudentByStatus('blocked', page, search)
			}
			actionIcons={[<NewLink key={'new-link'} href='/blocked-students/new' />]}
			renderItem={(it) => (
				<ListItem id={it.id} label={it.stdNo} description={it.student.name} />
			)}
		>
			{children}
		</ListLayout>
	);
}
