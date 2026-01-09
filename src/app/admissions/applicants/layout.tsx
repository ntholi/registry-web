'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import type { Applicant } from './_lib/types';
import { findAllApplicants } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	return (
		<ListLayout<Applicant>
			path='/admissions/applicants'
			queryKey={['applicants']}
			getData={findAllApplicants}
			actionIcons={[
				<NewLink key='new-link' href='/admissions/applicants/new' />,
			]}
			renderItem={(item) => (
				<ListItem
					id={item.id}
					label={item.fullName}
					description={item.nationalId || undefined}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
