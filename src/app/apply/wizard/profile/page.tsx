import { getApplicant } from '@admissions/applicants';
import { notFound } from 'next/navigation';
import ProfileView from './_components/ProfileView';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ProfilePage({ params }: Props) {
	const { id } = await params;
	const applicant = await getApplicant(id);

	if (!applicant) {
		return notFound();
	}

	return <ProfileView applicant={applicant} />;
}
