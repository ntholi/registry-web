'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { getCategories } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path='/academic/feedback/categories'
			queryKey={['feedback-categories']}
			getData={getCategories}
			actionIcons={[
				<NewLink key='new-link' href='/academic/feedback/categories/new' />,
			]}
			renderItem={(it) => <ListItem id={it.id} label={it.name} />}
		>
			{children}
		</ListLayout>
	);
}
