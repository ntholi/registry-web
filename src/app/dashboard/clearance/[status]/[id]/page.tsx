import { Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { DetailsView } from '@/components/adease';
import { getClearance } from '@/server/registration/clearance/actions';
import { getCurrentTerm } from '@/server/terms/actions';
import AcademicsLoader from './AcademicsLoader';
import ClearanceDetails from './ClearanceDetails';
import ClearanceHeader from './ClearanceHeader';
import ClearanceHistory from './ClearanceHistory';

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
			<Tabs defaultValue="details" variant="outline">
				<TabsList>
					<TabsTab value="details">Details</TabsTab>
					{session?.user?.role === 'finance' && <TabsTab value="academics">Academics</TabsTab>}
					<TabsTab value="history">History</TabsTab>
				</TabsList>
				<TabsPanel value="details">
					<ClearanceDetails request={request} termId={term.id} />
				</TabsPanel>
				<TabsPanel value="academics">
					<AcademicsLoader stdNo={request.registrationRequest.student.stdNo} />
				</TabsPanel>
				<TabsPanel value="history">
					<ClearanceHistory stdNo={request.registrationRequest.student.stdNo} />
				</TabsPanel>
			</Tabs>
		</DetailsView>
	);
}
