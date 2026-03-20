import { Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import { GraduationClearanceHeader } from '@registry/graduation';
import {
	GraduationClearanceDetails,
	GraduationClearanceHistory,
	getGraduationClearance,
} from '@registry/graduation/clearance';
import { AcademicsLoader } from '@registry/registration/clearance';
import { notFound } from 'next/navigation';
import StudentFinanceView from '@/app/registry/students/_components/finance/StudentFinanceView';
import { getSession } from '@/core/platform/withPermission';
import { DetailsView } from '@/shared/ui/adease';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function GraduationClearanceRequestDetails({
	params,
}: Props) {
	const { id } = await params;
	const request = await getGraduationClearance(Number(id));
	const session = await getSession();

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
					{session?.user?.role === 'finance' && (
						<TabsTab value='finance'>Finance</TabsTab>
					)}
					{['academic', 'finance'].includes(session?.user?.role || '') && (
						<TabsTab value='academics'>Academics</TabsTab>
					)}

					<TabsTab value='history'>History</TabsTab>
				</TabsList>
				<TabsPanel value='details'>
					<GraduationClearanceDetails request={request} />
				</TabsPanel>
				<TabsPanel value='finance' pb={'md'} pt='lg'>
					<StudentFinanceView
						stdNo={request.graduationRequest.studentProgram.stdNo}
						zohoContactId={null}
						isActive
					/>
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
