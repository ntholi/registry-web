'use client';

import { Group } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import ApplicationsFilter from './_components/ApplicationsFilter';
import StatusBadge from './_components/StatusBadge';
import type { ApplicationStatus, PaymentStatus } from './_lib/types';
import { findAllApplications } from './_server/actions';

type ApplicationListItem = {
	id: string;
	status: ApplicationStatus;
	paymentStatus: PaymentStatus;
	applicant: { id: string; fullName: string; nationalId: string | null };
	intakePeriod: { id: string; name: string };
	firstChoiceProgram: { id: number; name: string; code: string } | null;
};

export default function Layout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();

	const statusFilter = searchParams.get('status') as ApplicationStatus | null;
	const paymentFilter = searchParams.get('payment') as PaymentStatus | null;
	const intakeFilter = searchParams.get('intake');

	const filters = {
		...(statusFilter && { status: statusFilter }),
		...(paymentFilter && { paymentStatus: paymentFilter }),
		...(intakeFilter && { intakePeriodId: intakeFilter }),
	};

	return (
		<ListLayout<ApplicationListItem>
			path='/admissions/applications'
			queryKey={['applications', searchParams.toString()]}
			getData={(page, search) => findAllApplications(page, search, filters)}
			actionIcons={[
				<ApplicationsFilter key='filter' />,
				<NewLink key='new-link' href='/admissions/applications/new' />,
			]}
			renderItem={(item) => (
				<ListItem
					id={item.id}
					label={
						<Group gap='xs'>
							{item.applicant.fullName}
							<StatusBadge status={item.status} />
						</Group>
					}
					description={`${
						item.firstChoiceProgram?.code ?? 'Program pending'
					} • ${item.intakePeriod.name}`}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
