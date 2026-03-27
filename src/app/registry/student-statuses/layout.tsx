'use client';

import { Badge, Group } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { authClient } from '@/core/auth-client';
import { getStudentStatusTypeColor } from '@/shared/lib/utils/colors';
import { getStatusIcon, type StatusType } from '@/shared/lib/utils/status';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import StudentStatusesFilter from './_components/StudentStatusesFilter';
import { getApprovalRolesByUser } from './_lib/approvalRoles';
import { getTypeLabel } from './_lib/labels';
import {
	findAllStudentStatuses,
	type StudentStatusFilter,
} from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();
	const { data: session } = authClient.useSession();
	const approvalRoles = session ? getApprovalRolesByUser(session) : [];

	const getData = async (page: number, search: string) => {
		const filter: StudentStatusFilter = {};
		const type = searchParams.get('type');
		const status = searchParams.get('status');
		if (type) filter.type = type as StudentStatusFilter['type'];
		if (status) filter.status = status as StudentStatusFilter['status'];
		return findAllStudentStatuses(
			page,
			search,
			Object.keys(filter).length > 0 ? filter : undefined
		);
	};

	return (
		<ListLayout
			path='/registry/student-statuses'
			queryKey={['student-statuses', searchParams.toString()]}
			getData={getData}
			actionIcons={[
				<StudentStatusesFilter key='filter' />,
				<NewLink
					key='new-link'
					href='/registry/student-statuses/new'
					resource='student-statuses'
				/>,
			]}
			renderItem={(it) => {
				let displayStatus = it.status;
				if (approvalRoles.length > 0 && it.approvals) {
					const match = it.approvals.find((a) =>
						approvalRoles.includes(a.approverRole)
					);
					if (match) displayStatus = match.status;
				}
				return (
					<ListItem
						id={it.id}
						label={it.student?.name}
						description={
							<Group gap='xs'>
								{it.student?.stdNo}
								<Badge
									size='xs'
									radius={'sm'}
									variant='light'
									color={getStudentStatusTypeColor(it.type)}
								>
									{getTypeLabel(it.type)}
								</Badge>
							</Group>
						}
						rightSection={getStatusIcon(displayStatus as StatusType, {
							withColor: true,
						})}
					/>
				);
			}}
		>
			{children}
		</ListLayout>
	);
}
