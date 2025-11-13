import {
	Divider,
	Group,
	Stack,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
	ThemeIcon,
} from '@mantine/core';
import {
	IconCheck,
	IconClock,
	IconExclamationCircle,
} from '@tabler/icons-react';
import { notFound } from 'next/navigation';
import type { DashboardUser, registrationRequestStatus } from '@/db/schema';
import { getSponsoredStudent } from '@/server/finance/sponsors/actions';
import {
	deleteRegistrationRequest,
	getRegistrationRequest,
} from '@/server/registry/registration/requests/actions';
import { DetailsView, DetailsViewHeader } from '@/shared/components/adease';
import ClearanceAccordion from './ClearanceAccordion';
import ModulesView from './ModulesView';
import RequestDetailsView from './RequestDetailsView';

interface Props {
	params: Promise<{ id: string }>;
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function getOverallClearanceStatus(
	registrationRequest: NonNullable<
		Awaited<ReturnType<typeof getRegistrationRequest>>
	>
) {
	const departments: DashboardUser[] = ['finance', 'library'];
	const statuses = departments.map((dept) => {
		const clearanceMapping = registrationRequest.clearances?.find(
			(c) => c.clearance.department === dept
		);
		return clearanceMapping?.clearance.status || 'pending';
	});

	if (statuses.some((status) => status === 'rejected')) return 'rejected';
	if (statuses.some((status) => status === 'pending')) return 'pending';
	return 'approved';
}

function getStatusColor(
	status: (typeof registrationRequestStatus.enumValues)[number]
) {
	switch (status) {
		case 'approved':
			return 'green';
		case 'rejected':
			return 'red';
		default:
			return 'yellow';
	}
}

function getStatusIcon(
	status: (typeof registrationRequestStatus.enumValues)[number]
) {
	switch (status) {
		case 'approved':
			return <IconCheck size={16} />;
		case 'rejected':
			return <IconExclamationCircle size={16} />;
		default:
			return <IconClock size={16} />;
	}
}

export default async function RegistrationRequestDetails({
	params,
	searchParams,
}: Props) {
	const { id } = await params;
	const sp = (await searchParams) || {};
	const defaultTab = typeof sp.tab === 'string' ? sp.tab : undefined;
	type ClearanceDept = 'finance' | 'library';
	const rawDept = sp.dept;
	const deptParam = Array.isArray(rawDept) ? rawDept[0] : rawDept;
	const defaultDept: ClearanceDept | undefined =
		deptParam === 'finance' || deptParam === 'library'
			? (deptParam as ClearanceDept)
			: undefined;
	const registrationRequest = await getRegistrationRequest(Number(id));

	if (!registrationRequest) {
		return notFound();
	}

	const sponsorship = await getSponsoredStudent(
		registrationRequest.stdNo,
		registrationRequest.termId
	);

	return (
		<DetailsView>
			<DetailsViewHeader
				title={registrationRequest.student.name}
				queryKey={['registrationRequests']}
				editRoles={['registry']}
				handleDelete={async () => {
					'use server';
					await deleteRegistrationRequest(Number(id));
				}}
			/>
			<Tabs defaultValue={defaultTab || 'details'} variant='outline'>
				<TabsList>
					<TabsTab value='details'>Details</TabsTab>
					<TabsTab value='clearance'>
						<Group gap='xs'>
							<ThemeIcon
								color={getStatusColor(
									getOverallClearanceStatus(registrationRequest)
								)}
								variant='light'
								size={20}
							>
								{getStatusIcon(getOverallClearanceStatus(registrationRequest))}
							</ThemeIcon>
							Clearance
						</Group>
					</TabsTab>
				</TabsList>
				<TabsPanel value='details'>
					<Stack mt='md' p='sm'>
						<RequestDetailsView
							value={registrationRequest}
							sponsorship={sponsorship}
						/>
						<Divider />
						<ModulesView value={registrationRequest} />
					</Stack>
				</TabsPanel>
				<TabsPanel value='clearance'>
					<Stack gap='xl' mt='md' p='sm'>
						<ClearanceAccordion
							value={registrationRequest}
							defaultDept={defaultDept}
						/>
					</Stack>
				</TabsPanel>
			</Tabs>
		</DetailsView>
	);
}
