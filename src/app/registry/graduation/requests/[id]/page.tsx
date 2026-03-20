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
	type ClearanceDept,
	GRADUATION_CLEARANCE_DEPTS,
} from '@registry/clearance/_lib/constants';
import { getOverallClearanceStatus } from '@registry/clearance/_lib/status';
import {
	GraduationClearanceAccordion,
	PaymentReceiptsView,
} from '@registry/graduation';

import {
	deleteGraduationRequest,
	getGraduationRequest,
} from '@registry/graduation/clearance';
import {
	GraduationRequestDetailsView,
	ProofOfClearancePrinter,
} from '@registry/graduation/requests';
import { notFound } from 'next/navigation';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { getStatusIcon } from '@/shared/lib/utils/status';
import { DetailsView, DetailsViewHeader } from '@/shared/ui/adease';

interface Props {
	params: Promise<{ id: string }>;
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GraduationRequestDetails({
	params,
	searchParams,
}: Props) {
	const { id } = await params;
	const sp = (await searchParams) || {};
	const defaultTab = typeof sp.tab === 'string' ? sp.tab : undefined;
	const rawDept = sp.dept;
	const deptParam = Array.isArray(rawDept) ? rawDept[0] : rawDept;
	const defaultDept: ClearanceDept | undefined =
		deptParam === 'finance' || deptParam === 'academic' ? deptParam : undefined;

	const graduationRequest = await getGraduationRequest(Number(id));

	if (!graduationRequest) {
		return notFound();
	}

	const overallStatus = getOverallClearanceStatus(
		graduationRequest.graduationClearances,
		GRADUATION_CLEARANCE_DEPTS
	);

	return (
		<DetailsView>
			<DetailsViewHeader
				title={graduationRequest.studentProgram.student.name}
				queryKey={['graduation-requests']}
				editPermission={{ graduation: ['update'] }}
				handleDelete={async () => {
					'use server';
					return deleteGraduationRequest(Number(id));
				}}
			/>
			<Tabs defaultValue={defaultTab || 'details'} variant='outline' mt={'xl'}>
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
					{overallStatus === 'approved' && (
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
