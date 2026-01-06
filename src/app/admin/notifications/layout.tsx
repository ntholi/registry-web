'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { findAllNotifications } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/admin/notifications'}
			queryKey={['notifications']}
			getData={findAllNotifications}
			actionIcons={[
				<NewLink key={'new-link'} href='/admin/notifications/new' />,
			]}
			renderItem={(it) => (
				<ListItem
					id={it.id}
					label={it.title}
					description={`${it.targetType === 'all' ? 'All Users' : it.targetType === 'role' ? 'By Role' : 'Specific Users'}`}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
