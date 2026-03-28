'use client';

import type { PropsWithChildren } from 'react';
import { type AllStatusType, getStatusColor } from '@/shared/lib/utils/colors';
import { toTitleCase } from '@/shared/lib/utils/utils';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { getReferrals } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path='/student-services/referrals'
			queryKey={['referrals']}
			getData={async (page, search) => getReferrals(page, search)}
			actionIcons={[
				<NewLink
					key='new-link'
					href='/student-services/referrals/new'
					resource='student-referrals'
				/>,
			]}
			renderItem={(it) => {
				const item = it as typeof it & {
					studentName?: string;
					referrerName?: string;
				};
				return (
					<ListItem
						id={item.id}
						label={item.studentName ?? String(item.stdNo)}
						description={toTitleCase(item.reason)}
						color={getStatusColor(item.status as AllStatusType)}
					/>
				);
			}}
		>
			{children}
		</ListLayout>
	);
}
