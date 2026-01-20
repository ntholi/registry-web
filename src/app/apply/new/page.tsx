import { redirect } from 'next/navigation';
import { auth } from '@/core/auth';
import DocumentUploadClient from './_components/DocumentUploadClient';
import { getCurrentApplicant } from './_server/actions';

export default async function ApplyNewPage() {
	const session = await auth();

	if (!session?.user) {
		redirect('/auth/login?callbackUrl=/apply/new');
	}

	const applicant = await getCurrentApplicant();

	return <DocumentUploadClient applicant={applicant} user={session.user} />;
}
