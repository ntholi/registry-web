'use client';

import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import BlockedStudentStatusFilter from './_components/BlockedStudentStatusFilter';
import ImportBlockedStudentsDialog from './_components/ImportBlockedStudentsDialog';
import { getBlockedStudentByStatus } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();
	const status = (searchParams.get('status') || 'blocked') as
		| 'blocked'
		| 'unblocked';

	return (
		<ListLayout
			path={'/registry/blocked-students'}
			queryKey={['blocked-students', searchParams.toString()]}
			getData={async (page, search) =>
				await getBlockedStudentByStatus(status, page, search)
			}
			actionIcons={[
				<BlockedStudentStatusFilter key='status-filter' />,
				<ImportBlockedStudentsDialog key='import' />,
				<NewLink
					key={'new-link'}
					href='/registry/blocked-students/new'
					resource='blocked-students'
				/>,
			]}
			renderItem={(it) => (
				<ListItem id={it.id} label={it.stdNo} description={it.student.name} />
			)}
		>
			{children}
		</ListLayout>
	);
}
