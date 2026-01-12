'use client';

import { IconCheck } from '@tabler/icons-react';
import type { PropsWithChildren } from 'react';
import { findAllTerms } from '@/app/registry/terms';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path={'/registry/dates/terms'}
			queryKey={['terms']}
			getData={findAllTerms}
			actionIcons={[
				<NewLink key={'new-link'} href='/registry/dates/terms/new' />,
			]}
			renderItem={(it) => (
				<ListItem
					id={it.code}
					label={it.code}
					rightSection={
						it.isActive ? <IconCheck size={'1rem'} color='green' /> : null
					}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
