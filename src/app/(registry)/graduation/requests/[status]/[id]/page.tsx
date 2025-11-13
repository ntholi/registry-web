import {
	Box,
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
import type { DashboardUser } from '@/core/database/schema';
import {
	deleteGraduationRequest,
	getGraduationRequest,
} from '@/modules/registry/features/graduation-clearance/server/requests/actions';
import GraduationClearanceAccordion from '@/modules/registry/features/graduation-requests/components/[status]/[id]/GraduationClearanceAccordion';
import GraduationRequestDetailsView from '@/modules/registry/features/graduation-requests/components/[status]/[id]/GraduationRequestDetailsView';
import PaymentReceiptsView from '@/modules/registry/features/graduation-requests/components/[status]/[id]/PaymentReceiptsView';
import ProofOfClearancePrinter from '@/modules/registry/features/graduation-requests/components/[status]/[id]/ProofOfClearancePrinter';
import { DetailsView, DetailsViewHeader } from '@/shared/components/adease';

interface Props {
	params: Promise<{ id: string }>;
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function getOverallClearanceStatus(
	graduationRequest: NonNullable<
		Awaited<ReturnType<typeof getGraduationRequest>>
	>
) {
	const departments: DashboardUser[] = ['finance', 'library', 'academic'];
	const statuses = departments.map((dept) => {
		const clearanceMapping = graduationRequest.graduationClearances?.find(
			(c) => c.clearance.department === dept
		);
		return clearanceMapping?.clearance.status || 'pending';
	});

	if (statuses.some((status) => status === 'rejected')) return 'rejected';
	if (statuses.some((status) => status === 'pending')) return 'pending';
	return 'approved';
}

function getStatusColor(status: 'approved' | 'rejected' | 'pending') {
	switch (status) {
		case 'approved':
			return 'green';
		case 'rejected':
			return 'red';
		default:
			return 'yellow';
	}
}

function getStatusIcon(status: 'approved' | 'rejected' | 'pending') {
	switch (status) {
		case 'approved':
			return <IconCheck size={16} />;
		case 'rejected':
			return <IconExclamationCircle size={16} />;
		default:
			return <IconClock size={16} />;
	}
}

export default async function GraduationRequestDetails({
	params,
	searchParams,
}: Props) {
	const { id } = await params;
	const sp = (await searchParams) || {};
	const defaultTab = typeof sp.tab === 'string' ? sp.tab : undefined;
	type ClearanceDept = 'finance' | 'library' | 'academic';
	const rawDept = sp.dept;
	const deptParam = Array.isArray(rawDept) ? rawDept[0] : rawDept;
	const defaultDept: ClearanceDept | undefined =
		deptParam === 'finance' ||
		deptParam === 'library' ||
		deptParam === 'academic'
			? (deptParam as ClearanceDept)
			: undefined;

	const graduationRequest = await getGraduationRequest(Number(id));

	if (!graduationRequest) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title={graduationRequest.studentProgram.student.name}
				queryKey={['graduationRequests']}
				editRoles={['registry', 'admin']}
				handleDelete={async () => {
					'use server';
					await deleteGraduationRequest(Number(id));
				}}
			/>
			<Tabs defaultValue={defaultTab || 'details'} variant='outline' mt={'xl'}>
				<TabsList>
					<TabsTab value='details'>Details</TabsTab>
					<TabsTab value='clearance'>
						<Group gap='xs'>
							<ThemeIcon
								color={getStatusColor(
									getOverallClearanceStatus(graduationRequest)
								)}
								variant='light'
								size={20}
							>
								{getStatusIcon(getOverallClearanceStatus(graduationRequest))}
							</ThemeIcon>
							Clearance
						</Group>
					</TabsTab>
					{getOverallClearanceStatus(graduationRequest) === 'approved' && (
						<Box ml='auto'>
							<ProofOfClearancePrinter requestId={id} />
						</Box>
					)}
				</TabsList>
				<TabsPanel value='details'>
					<Stack mt='md' p='sm'>
						<GraduationRequestDetailsView value={graduationRequest} />
						<Divider />
						<PaymentReceiptsView value={graduationRequest} />
					</Stack>
				</TabsPanel>
				<TabsPanel value='clearance'>
					<Stack gap='xl' mt='md' p='sm'>
						<GraduationClearanceAccordion
							value={graduationRequest}
							defaultDept={defaultDept}
						/>
					</Stack>
				</TabsPanel>
			</Tabs>
		</DetailsView>
	);
}
