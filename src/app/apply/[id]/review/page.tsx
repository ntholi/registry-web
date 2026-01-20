import { notFound } from 'next/navigation';
import ReviewForm from './_components/ReviewForm';
import { getApplicantWithApplication } from './_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ReviewPage({ params }: Props) {
	const { id } = await params;
	const { applicant, application } = await getApplicantWithApplication(id);

	if (!applicant) {
		return notFound();
	}

	return (
		<ReviewForm
			applicantId={id}
			applicant={applicant}
			application={application}
		/>
	);
}
