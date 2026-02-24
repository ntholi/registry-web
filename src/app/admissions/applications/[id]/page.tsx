import { findAcademicRecordsByApplicant } from '@admissions/applicants/[id]/academic-records/_server/actions';
import { findDocumentsByApplicant } from '@admissions/applicants/[id]/documents/_server/actions';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DetailsView, DetailsViewHeader } from '@/shared/ui/adease';
import ApplicationReviewHeader from '../_components/ApplicationReviewHeader';
import ApplicationTabs from '../_components/ApplicationTabs';
import type { ApplicationStatus } from '../_lib/types';
import { deleteApplication, getApplication } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { id } = await params;
	const item = await getApplication(id);
	return {
		title: item ? `${item.applicant.fullName} | Application` : 'Application',
	};
}

export default async function ApplicationDetails({ params }: Props) {
	const { id } = await params;
	const item = await getApplication(id);

	if (!item) {
		return notFound();
	}

	const [academicRecordsResult, documentsResult] = await Promise.all([
		findAcademicRecordsByApplicant(item.applicant.id),
		findDocumentsByApplicant(item.applicant.id),
	]);

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Application'
				queryKey={['applications']}
				handleDelete={async () => {
					'use server';
					await deleteApplication(id);
				}}
				deleteRoles={['admin']}
				itemName={`${item.applicant.fullName} - ${item.intakePeriod.name}`}
				itemType='Application'
			/>
			<ApplicationReviewHeader
				applicationId={item.id}
				applicantName={item.applicant.fullName}
				currentStatus={item.status as ApplicationStatus}
			/>
			<ApplicationTabs
				application={item}
				academicRecords={academicRecordsResult.items}
				documents={documentsResult.items}
			/>
		</DetailsView>
	);
}
