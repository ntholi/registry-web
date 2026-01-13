'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import ImportBlockedStudentsDialog from './_components/ImportBlockedStudentsDialog';
import { getBlockedStudentByStatus } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/registry/blocked-students'}
			queryKey={['blocked-students']}
			getData={async (page, search) =>
				await getBlockedStudentByStatus('blocked', page, search)
			}
			actionIcons={[
				<ImportBlockedStudentsDialog key='import' />,
				<NewLink key={'new-link'} href='/registry/blocked-students/new' />,
			]}
			renderItem={(it) => (
				<ListItem id={it.id} label={it.stdNo} description={it.student.name} />
			)}
		>
			{children}
		</ListLayout>
	);
}
