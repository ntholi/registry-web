'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { getCategories } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/library/categories'}
			queryKey={['categories']}
			getData={getCategories}
			actionIcons={[
				<NewLink key={'new-link'} href='/library/categories/new' />,
			]}
			renderItem={(it) => <ListItem id={it.id} label={it.name} />}
		>
			{children}
		</ListLayout>
	);
}
