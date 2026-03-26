'use client';

import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import ApplicantIntakePeriodFilter from './_components/ApplicantIntakePeriodFilter';
import type { Applicant } from './_lib/types';
import { findAllApplicants } from './_server/actions';

export default function Layout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();
	const intakePeriodId = searchParams.get('intakePeriodId') || undefined;

	return (
		<ListLayout<Applicant>
			path='/admissions/applicants'
			queryKey={['applicants', searchParams.toString()]}
			getData={async (page, search) =>
				findAllApplicants(page, search, intakePeriodId)
			}
			actionIcons={[
				<ApplicantIntakePeriodFilter key='filter' />,
				<NewLink
					key='new-link'
					href='/admissions/applicants/new'
					resource='applicants'
				/>,
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
