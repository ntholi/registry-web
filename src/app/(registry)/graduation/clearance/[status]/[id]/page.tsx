import { Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import AcademicsLoader from '@registry/clearance/[status]/[id]/AcademicsLoader';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getGraduationClearance } from '@/server/registry/graduation/clearance/actions';
import { DetailsView } from '@/shared/components/adease';
import GraduationClearanceDetails from './GraduationClearanceDetails';
import GraduationClearanceHeader from './GraduationClearanceHeader';
import GraduationClearanceHistory from './GraduationClearanceHistory';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function GraduationClearanceRequestDetails({
	params,
}: Props) {
	const { id } = await params;
	const request = await getGraduationClearance(Number(id));
	const session = await auth();

	if (!request) {
		return notFound();
	}

	return (
		<DetailsView>
			<GraduationClearanceHeader
				studentName={request.graduationRequest.studentProgram.student.name}
			/>
			<Tabs defaultValue='details' variant='outline'>
				<TabsList>
					<TabsTab value='details'>Details</TabsTab>
					{['academic', 'finance'].includes(session?.user?.role || '') && (
						<TabsTab value='academics'>Academics</TabsTab>
					)}
					<TabsTab value='history'>History</TabsTab>
				</TabsList>
				<TabsPanel value='details'>
					<GraduationClearanceDetails request={request} />
				</TabsPanel>
				<TabsPanel value='academics'>
					<AcademicsLoader
						stdNo={request.graduationRequest.studentProgram.stdNo}
					/>
				</TabsPanel>
				<TabsPanel value='history'>
					<GraduationClearanceHistory
						stdNo={request.graduationRequest.studentProgram.stdNo}
					/>
				</TabsPanel>
			</Tabs>
		</DetailsView>
	);
}
