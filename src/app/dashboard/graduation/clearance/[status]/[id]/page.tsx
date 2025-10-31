import { Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import { notFound } from 'next/navigation';
import AcademicsLoader from '@/app/dashboard/clearance/[status]/[id]/AcademicsLoader';
import { auth } from '@/auth';
import { DetailsView } from '@/components/adease';
import { getGraduationClearance } from '@/server/graduation/clearance/actions';
import GraduationClearanceDetails from './GraduationClearanceDetails';
import GraduationClearanceHeader from './GraduationClearanceHeader';
import GraduationClearanceHistory from './GraduationClearanceHistory';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function GraduationClearanceRequestDetails({ params }: Props) {
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
					<AcademicsLoader stdNo={request.graduationRequest.studentProgram.stdNo} />
				</TabsPanel>
				<TabsPanel value='history'>
					<GraduationClearanceHistory stdNo={request.graduationRequest.studentProgram.stdNo} />
				</TabsPanel>
			</Tabs>
		</DetailsView>
	);
}
