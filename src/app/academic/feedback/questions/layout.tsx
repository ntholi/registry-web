'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { getQuestions } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path='/academic/feedback/questions'
			queryKey={['feedback-questions']}
			getData={getQuestions}
			actionIcons={[
				<NewLink key='new-link' href='/academic/feedback/questions/new' />,
			]}
			renderItem={(it) => (
				<ListItem
					id={it.id}
					label={it.text}
					description={it.active ? 'Active' : 'Inactive'}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
