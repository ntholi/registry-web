import { Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import { notFound } from 'next/navigation';
import { auth } from '@/core/auth';
import AcademicsLoader from '@/modules/registry/features/registration/clearance/components/AcademicsLoader';
import ClearanceDetails from '@/modules/registry/features/registration/clearance/components/ClearanceDetails';
import ClearanceHeader from '@/modules/registry/features/registration/clearance/components/ClearanceHeader';
import ClearanceHistory from '@/modules/registry/features/registration/clearance/components/ClearanceHistory';
import { getClearance } from '@/modules/registry/features/registration/requests/server/clearance/actions';
import { getCurrentTerm } from '@/modules/registry/features/terms/server/actions';
import { DetailsView } from '@/shared/ui/adease';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ClearanceRequestDetails({ params }: Props) {
	const { id } = await params;
	const request = await getClearance(Number(id));
	const session = await auth();
	const term = await getCurrentTerm();

	if (!request) {
		return notFound();
	}

	return (
		<DetailsView>
			<ClearanceHeader
				studentName={request.registrationRequest.student.name}
				termName={request.registrationRequest.term.name}
				versionCount={request.registrationRequest.count}
			/>
			<Tabs defaultValue='details' variant='outline'>
				<TabsList>
					<TabsTab value='details'>Details</TabsTab>
					{session?.user?.role === 'finance' && (
						<TabsTab value='academics'>Academics</TabsTab>
					)}
					<TabsTab value='history'>History</TabsTab>
				</TabsList>
				<TabsPanel value='details'>
					<ClearanceDetails request={request} termId={term.id} />
				</TabsPanel>
				<TabsPanel value='academics'>
					<AcademicsLoader stdNo={request.registrationRequest.student.stdNo} />
				</TabsPanel>
				<TabsPanel value='history'>
					<ClearanceHistory stdNo={request.registrationRequest.student.stdNo} />
				</TabsPanel>
			</Tabs>
		</DetailsView>
	);
}
