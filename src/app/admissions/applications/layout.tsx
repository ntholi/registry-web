'use client';

import {
	applicationStatusEnum,
	paymentStatusEnum,
} from '@admissions/_database';
import { Group, Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { findAllIntakePeriods } from '../intake-periods/_server/actions';
import StatusBadge from './_components/StatusBadge';
import type { ApplicationStatus, PaymentStatus } from './_lib/types';
import { findAllApplications } from './_server/actions';

type ApplicationListItem = {
	id: number;
	status: ApplicationStatus;
	paymentStatus: PaymentStatus;
	applicant: { id: string; fullName: string; nationalId: string | null };
	intakePeriod: { id: number; name: string };
	firstChoiceProgram: { id: number; name: string; code: string };
};

export default function Layout({ children }: PropsWithChildren) {
	const searchParams = useSearchParams();
	const router = useRouter();

	const statusFilter = searchParams.get('status') as ApplicationStatus | null;
	const paymentFilter = searchParams.get('payment') as PaymentStatus | null;
	const intakeFilter = searchParams.get('intake');

	const { data: intakePeriods } = useQuery({
		queryKey: ['intake-periods', 'list'],
		queryFn: () => findAllIntakePeriods(1, ''),
	});

	const statusOptions = [
		{ value: '', label: 'All Statuses' },
		...applicationStatusEnum.enumValues.map((s) => ({
			value: s,
			label: s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
		})),
	];

	const paymentOptions = [
		{ value: '', label: 'All Payments' },
		...paymentStatusEnum.enumValues.map((s) => ({
			value: s,
			label: s.charAt(0).toUpperCase() + s.slice(1),
		})),
	];

	const intakeOptions = [
		{ value: '', label: 'All Intakes' },
		...(intakePeriods?.items?.map((ip) => ({
			value: ip.id.toString(),
			label: ip.name,
		})) || []),
	];

	function updateFilter(key: string, value: string | null) {
		const params = new URLSearchParams(searchParams);
		if (value) {
			params.set(key, value);
		} else {
			params.delete(key);
		}
		params.delete('page');
		router.push(`/admissions/applications?${params.toString()}`);
	}

	const filters = {
		...(statusFilter && { status: statusFilter }),
		...(paymentFilter && { paymentStatus: paymentFilter }),
		...(intakeFilter && { intakePeriodId: Number(intakeFilter) }),
	};

	return (
		<ListLayout<ApplicationListItem>
			path='/admissions/applications'
			queryKey={[
				'applications',
				statusFilter || '',
				paymentFilter || '',
				intakeFilter || '',
			]}
			getData={(page, search) => findAllApplications(page, search, filters)}
			actionIcons={[
				<Group key='filters' gap='xs'>
					<Select
						size='xs'
						placeholder='Status'
						data={statusOptions}
						value={statusFilter || ''}
						onChange={(val) => updateFilter('status', val)}
						clearable
						w={150}
					/>
					<Select
						size='xs'
						placeholder='Payment'
						data={paymentOptions}
						value={paymentFilter || ''}
						onChange={(val) => updateFilter('payment', val)}
						clearable
						w={120}
					/>
					<Select
						size='xs'
						placeholder='Intake'
						data={intakeOptions}
						value={intakeFilter || ''}
						onChange={(val) => updateFilter('intake', val)}
						clearable
						w={150}
					/>
				</Group>,
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
					description={`${item.firstChoiceProgram.code} • ${item.intakePeriod.name}`}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
