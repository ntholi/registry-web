'use client';

import { Badge, Group, Text } from '@mantine/core';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import BulkImportModal from './_components/BulkImportModal';
import { findAllAutoApprovals } from './_server/actions';

type RuleItem = {
	id: number;
	stdNo: number;
	department: string;
	term: { code: string } | null;
};

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout<RuleItem>
			path='/registry/registration/clearance/auto-approve'
			queryKey={['auto-approvals']}
			getData={findAllAutoApprovals}
			actionIcons={[
				<BulkImportModal key='bulk' />,
				<NewLink
					key='new'
					href='/registry/registration/clearance/auto-approve/new'
				/>,
			]}
			renderItem={(item) => (
				<ListItem
					id={item.id.toString()}
					label={
						<Group gap='xs'>
							<Text fw={500}>{item.stdNo}</Text>
							<Badge size='xs' variant='light'>
								{item.term?.code ?? 'Unknown'}
							</Badge>
						</Group>
					}
					description={
						<Badge
							size='xs'
							color={item.department === 'finance' ? 'green' : 'blue'}
						>
							{item.department}
						</Badge>
					}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
