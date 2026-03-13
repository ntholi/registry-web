import { Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import { ClearanceDetails, ClearanceHistory } from '@registry/registration';
import {
	AcademicsLoader,
	ClearanceHeader,
} from '@registry/registration/clearance';
import { getClearance } from '@registry/registration/requests';
import { notFound } from 'next/navigation';
import StudentFinanceView from '@/app/registry/students/_components/finance/StudentFinanceView';
import { getActiveTerm } from '@/app/registry/terms';
import { getSession } from '@/core/platform/withPermission';
import { DetailsView } from '@/shared/ui/adease';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ClearanceRequestDetails({ params }: Props) {
	const { id } = await params;
	const request = await getClearance(Number(id));
	const session = await getSession();
	const term = await getActiveTerm();

	if (!request) {
		return notFound();
	}

	return (
		<DetailsView>
			<ClearanceHeader
				studentName={request.registrationRequest.student.name}
				termCode={request.registrationRequest.term.code}
				versionCount={request.registrationRequest.count}
			/>
			<Tabs defaultValue='details' variant='outline'>
				<TabsList>
					<TabsTab value='details'>Details</TabsTab>
					{session?.user?.role === 'finance' && (
						<TabsTab value='finance'>Finance</TabsTab>
					)}
					{session?.user?.role === 'finance' && (
						<TabsTab value='academics'>Academics</TabsTab>
					)}

					<TabsTab value='history'>History</TabsTab>
				</TabsList>
				<TabsPanel value='details'>
					<ClearanceDetails request={request} termId={term.id} />
				</TabsPanel>
				<TabsPanel value='finance' p={'md'} pt='lg'>
					<StudentFinanceView
						stdNo={request.registrationRequest.student.stdNo}
						zohoContactId={null}
						isActive
					/>
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
