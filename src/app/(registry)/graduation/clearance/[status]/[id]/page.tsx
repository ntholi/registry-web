import { Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import { notFound } from 'next/navigation';
import { auth } from '@/core/auth';
import GraduationClearanceDetails from '@/modules/registry/features/graduation/clearance/components/GraduationClearanceDetails';
import GraduationClearanceHeader from '@/modules/registry/features/graduation/clearance/components/GraduationClearanceHeader';
import GraduationClearanceHistory from '@/modules/registry/features/graduation/clearance/components/GraduationClearanceHistory';
import { getGraduationClearance } from '@/modules/registry/features/graduation/clearance/server/clearance/actions';
import AcademicsLoader from '@/modules/registry/features/registration/clearance/components/AcademicsLoader';
import { DetailsView } from '@/shared/ui/adease';

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
