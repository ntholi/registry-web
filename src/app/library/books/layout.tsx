'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { getBooks } from './_server/actions';

export default function BooksLayout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path='/library/books'
			queryKey={['books']}
			getData={getBooks}
			actionIcons={[<NewLink key='new' href='/library/books/new' />]}
			renderItem={(it) => (
				<ListItem id={it.id} label={it.title} description={it.isbn} />
			)}
		>
			{children}
		</ListLayout>
	);
}
