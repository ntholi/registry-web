'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { getLetters } from '../_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path='/registry/letters/generate'
			queryKey={['letters']}
			getData={getLetters}
			actionIcons={[
				<NewLink
					key='new-link'
					href='/registry/letters/generate/new'
					resource='letters'
				/>,
			]}
			renderItem={(it) => (
				<ListItem
					id={it.id}
					label={it.serialNumber}
					description={it.student?.name}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
