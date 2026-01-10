'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { getAuthors } from './_server/actions';

export default function AuthorsLayout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path='/library/authors'
			queryKey={['authors']}
			getData={getAuthors}
			actionIcons={[<NewLink key='new' href='/library/authors/new' />]}
			renderItem={(it) => <ListItem id={it.id} label={it.name} />}
		>
			{children}
		</ListLayout>
	);
}
