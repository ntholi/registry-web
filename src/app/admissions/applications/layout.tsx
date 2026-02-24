'use client';

import { Badge, Text } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import type { ApplicationStatusType } from '@/shared/lib/utils/colors';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import ApplicationsFilter from './_components/ApplicationsFilter';
import { statusLabels } from './_components/StatusBadge';
import type { ApplicationStatus, PaymentStatus } from './_lib/types';
import { findAllApplications } from './_server/actions';

type ApplicationListItem = {
	id: string;
	status: ApplicationStatus;
	paymentStatus: PaymentStatus;
	applicant: { id: string; fullName: string; nationalId: string | null };
	intakePeriod: { id: string; name: string };
	firstChoiceProgram: { id: number; name: string; code: string } | null;
	scores: {
		overallScore: number | null;
		firstChoiceScore: number | null;
		secondChoiceScore: number | null;
	} | null;
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
					label={item.applicant.fullName}
					rightSection={
						item?.scores?.overallScore ? (
							<Badge size='xs' variant='light' color='blue'>
								{item.scores.overallScore.toFixed(1)}
							</Badge>
						) : undefined
					}
					description={
						<StatusText
							programCode={item.firstChoiceProgram?.code}
							status={item.status}
						/>
					}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}

function StatusText({
	programCode,
	status,
}: {
	programCode: string | null | undefined;
	status: ApplicationStatusType;
}) {
	const label = statusLabels[status] || status;
	return (
		<Text c={'dimmed'} size='xs' variant='light'>
			{`${programCode ?? 'Program pending'} • ${label}}`}
		</Text>
	);
}
