'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { getExternalLibraries } from './_server/actions';

export default function ExternalLibrariesLayout({
	children,
}: PropsWithChildren) {
	return (
		<ListLayout
			path='/library/external-libraries'
			queryKey={['external-libraries']}
			getData={getExternalLibraries}
			actionIcons={[
				<NewLink key='new' href='/library/external-libraries/new' />,
			]}
			renderItem={(item) => (
				<ListItem id={item.id} label={item.name} description={item.url} />
			)}
		>
			{children}
		</ListLayout>
	);
}
