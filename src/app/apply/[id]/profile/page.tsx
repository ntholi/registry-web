import { getApplicant } from '@admissions/applicants';
import { getApplication } from '@admissions/applications';
import { notFound } from 'next/navigation';
import ProfileView from './_components/ProfileView';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ProfilePage({ params }: Props) {
	const { id } = await params;
	const application = await getApplication(id);

	if (!application?.applicantId) {
		return notFound();
	}

	const applicant = await getApplicant(application.applicantId);

	if (!applicant) {
		return notFound();
	}

	return <ProfileView applicant={applicant} />;
}
