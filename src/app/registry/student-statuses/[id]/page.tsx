import { Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import { AcademicsLoader } from '@registry/registration/clearance';
import { notFound } from 'next/navigation';
import StudentFinanceView from '@/app/registry/students/_components/finance/StudentFinanceView';
import { getSession } from '@/core/platform/withPermission';
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

	const role = session?.user?.role;

	return (
		<DetailsView>
			<StatusHeader
				title={app.student?.name ?? String(app.stdNo)}
				type={app.type}
				status={app.status}
				id={id}
			/>
			<Tabs defaultValue='details' variant='outline'>
				<TabsList>
					<TabsTab value='details'>Details</TabsTab>
					{role === 'finance' && <TabsTab value='finance'>Finance</TabsTab>}
					{role === 'finance' && <TabsTab value='academics'>Academics</TabsTab>}
					<TabsTab value='timeline'>Timeline</TabsTab>
				</TabsList>
				<TabsPanel value='details'>
					<StatusDetails app={app} />
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
