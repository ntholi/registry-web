'use client';

import { resolveApplicationFee } from '@admissions/_lib/fees';
import type { AcademicRecordWithRelations } from '@admissions/applicants/[id]/academic-records/_lib/types';
import type { ApplicantDocument } from '@admissions/applicants/[id]/documents/_lib/types';
import RecordAuditHistory from '@audit-logs/_components/RecordAuditHistory';
import { Tabs, TabsPanel, TabsTab } from '@mantine/core';
import { useQueryState } from 'nuqs';
import ScrollableTabsList from '@/shared/ui/ScrollableTabsList';
import type { PaymentStatus } from '../_lib/types';
import type { getApplication } from '../_server/actions';
import ApplicationDocumentsTab from './ApplicationDocumentsTab';
import NotesSection from './NotesSection';
import OverviewTab from './OverviewTab';
import PaymentSection from './PaymentSection';
import ScoresSection from './ScoresSection';
import StatusHistory from './StatusHistory';

type Props = {
	application: NonNullable<Awaited<ReturnType<typeof getApplication>>>;
	academicRecords: AcademicRecordWithRelations[];
	documents: ApplicantDocument[];
};

export default function ApplicationTabs({
	application,
	academicRecords,
	documents,
}: Props) {
	const [activeTab, setActiveTab] = useQueryState('tab', {
		defaultValue: 'overview',
	});

	return (
		<Tabs value={activeTab} onChange={setActiveTab} variant='outline' mt='xl'>
			<ScrollableTabsList>
				<TabsTab value='overview'>Overview</TabsTab>
				<TabsTab value='scores'>Scores</TabsTab>
				<TabsTab value='payment'>Payment</TabsTab>
				<TabsTab value='documents'>Documents</TabsTab>
				<TabsTab value='history'>History</TabsTab>
				<TabsTab value='notes'>Notes</TabsTab>
				<TabsTab value='audit'>Audit</TabsTab>
			</ScrollableTabsList>

			<TabsPanel value='overview' pt='xl' p='sm'>
				<OverviewTab
					firstChoiceProgram={application.firstChoiceProgram}
					secondChoiceProgram={application.secondChoiceProgram}
					academicRecords={academicRecords}
				/>
			</TabsPanel>

			<TabsPanel value='scores' pt='xl' p='sm'>
				<ScoresSection
					applicationId={application.id}
					scores={application.scores}
					firstChoiceProgram={application.firstChoiceProgram}
					secondChoiceProgram={application.secondChoiceProgram}
				/>
			</TabsPanel>

			<TabsPanel value='payment' pt='xl' p='sm'>
				<PaymentSection
					feeAmount={resolveApplicationFee(
						application.intakePeriod,
						application.applicant.nationality
					)}
					paymentStatus={application.paymentStatus as PaymentStatus}
					bankDeposits={application.bankDeposits}
				/>
			</TabsPanel>

			<TabsPanel value='documents' pt='xl' p='sm'>
				<ApplicationDocumentsTab
					applicantId={application.applicant.id}
					documents={documents}
					isActive={activeTab === 'documents'}
				/>
			</TabsPanel>

			<TabsPanel value='history' pt='xl' p='sm'>
				<StatusHistory history={application.statusHistory} />
			</TabsPanel>

			<TabsPanel value='notes' pt='xl' p='sm'>
				<NotesSection
					applicationId={application.id}
					notes={application.notes}
				/>
			</TabsPanel>

			<TabsPanel value='audit' pt='xl' p='sm'>
				<RecordAuditHistory
					tableName='applications'
					recordId={application.id}
				/>
			</TabsPanel>
		</Tabs>
	);
}
