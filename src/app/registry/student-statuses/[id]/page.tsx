import {
	Group,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
	ThemeIcon,
} from '@mantine/core';
import { AcademicsLoader } from '@registry/registration/clearance';
import { notFound } from 'next/navigation';
import StudentFinanceView from '@/app/registry/students/_components/finance/StudentFinanceView';
import { getEffectiveViewer } from '@/core/auth/sessionPermissions';
import { getSession } from '@/core/platform/withPermission';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { getStatusIcon, type StatusType } from '@/shared/lib/utils/status';
import { DetailsView } from '@/shared/ui/adease';
import StatusDetails from '../_components/StatusDetails';
import StatusHeader from '../_components/StatusHeader';
import StatusTimeline from '../_components/StatusTimeline';
import { getStudentStatus } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function StudentStatusDetailsPage({ params }: Props) {
	const { id } = await params;
	const app = await getStudentStatus(id);
	const session = await getSession();

	if (!app) {
		return notFound();
	}

	const viewer = getEffectiveViewer(session);
	const role = viewer?.role;

	return (
		<DetailsView>
			<StatusHeader
				title={app.student?.name ?? String(app.stdNo)}
				type={app.type}
				status={app.status}
				id={id}
				role={role}
			/>
			<Tabs defaultValue='details' variant='outline'>
				<TabsList>
					<TabsTab value='details'>Details</TabsTab>
					{role === 'finance' && <TabsTab value='finance'>Finance</TabsTab>}
					{role === 'finance' && <TabsTab value='academics'>Academics</TabsTab>}
					<TabsTab value='timeline'>
						<Group gap='xs'>
							<ThemeIcon
								color={getStatusColor(app.status)}
								variant='light'
								size={20}
							>
								{getStatusIcon(app.status as StatusType, { size: 16 })}
							</ThemeIcon>
							Timeline
						</Group>
					</TabsTab>
				</TabsList>
				<TabsPanel value='details'>
					<StatusDetails app={app} viewer={viewer} />
				</TabsPanel>
				{role === 'finance' && (
					<TabsPanel value='finance' p='md' pt='lg'>
						<StudentFinanceView
							stdNo={app.stdNo}
							zohoContactId={null}
							isActive
						/>
					</TabsPanel>
				)}
				{role === 'finance' && (
					<TabsPanel value='academics'>
						<AcademicsLoader stdNo={app.stdNo} />
					</TabsPanel>
				)}
				<TabsPanel value='timeline' p='lg'>
					<StatusTimeline
						createdAt={app.createdAt}
						creatorName={app.creator?.name ?? null}
						approvals={app.approvals ?? []}
						status={app.status}
						updatedAt={app.updatedAt}
					/>
				</TabsPanel>
			</Tabs>
		</DetailsView>
	);
}
