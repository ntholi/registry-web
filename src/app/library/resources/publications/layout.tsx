'use client';

import type { PropsWithChildren } from 'react';
import {
	ListItem,
	ListLayout,
	type ListLayoutGetDataParams,
	NewLink,
} from '@/shared/ui/adease';
import type { PublicationWithRelations } from './_lib/types';
import { getPublications } from './_server/actions';

export default function PublicationsLayout({ children }: PropsWithChildren) {
	async function getData({ page, search }: ListLayoutGetDataParams) {
		return getPublications(page, search);
	}

	return (
		<ListLayout<PublicationWithRelations>
			path='/library/resources/publications'
			queryKey={['publications']}
			getData={getData}
			actionIcons={[
				<NewLink key='new' href='/library/resources/publications/new' />,
			]}
			renderItem={(item) => (
				<ListItem
					id={item.id}
					label={item.title}
					description={item.publicationAuthors
						?.map((pa) => pa.author.name)
						.join(', ')}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
