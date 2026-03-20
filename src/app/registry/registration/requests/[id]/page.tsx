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
	type ClearanceDept,
	REGISTRATION_CLEARANCE_DEPTS,
} from '@registry/clearance/_lib/constants';
import { getOverallClearanceStatus } from '@registry/clearance/_lib/status';
import { ClearanceAccordion, RequestDetailsView } from '@registry/registration';
import {
	deleteRegistrationRequest,
	getRegistrationRequest,
	ModulesView,
} from '@registry/registration/requests';
import { notFound } from 'next/navigation';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { getStatusIcon } from '@/shared/lib/utils/status';
import { DetailsView, DetailsViewHeader } from '@/shared/ui/adease';

interface Props {
	params: Promise<{ id: string }>;
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RegistrationRequestDetails({
	params,
	searchParams,
}: Props) {
	const { id } = await params;
	const sp = (await searchParams) || {};
	const defaultTab = typeof sp.tab === 'string' ? sp.tab : undefined;
	const rawDept = sp.dept;
	const deptParam = Array.isArray(rawDept) ? rawDept[0] : rawDept;
	const defaultDept: ClearanceDept | undefined =
		deptParam === 'finance' ? deptParam : undefined;
	const registrationRequest = await getRegistrationRequest(Number(id));

	if (!registrationRequest) {
		return notFound();
	}

	const overallStatus = getOverallClearanceStatus(
		registrationRequest.clearances,
		REGISTRATION_CLEARANCE_DEPTS
	);
	const sponsorship = registrationRequest.sponsoredStudent;

	return (
		<DetailsView>
			<DetailsViewHeader
				title={registrationRequest.student.name}
				queryKey={['registration-requests']}
				editPermission={{ registration: ['update'] }}
				deletePermission={{ registration: ['delete'] }}
				typedConfirmation={false}
				handleDelete={async () => {
					'use server';
					return deleteRegistrationRequest(Number(id));
				}}
			/>
			<Tabs defaultValue={defaultTab || 'details'} variant='outline'>
				<TabsList>
					<TabsTab value='details'>Details</TabsTab>
					<TabsTab value='clearance'>
						<Group gap='xs'>
							<ThemeIcon
								color={getStatusColor(overallStatus)}
								variant='light'
								size={20}
							>
								{getStatusIcon(overallStatus, {
									size: 16,
								})}
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
