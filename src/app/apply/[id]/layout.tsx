import { getApplicant } from '@admissions/applicants';
import { notFound, redirect } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { auth } from '@/core/auth';
import WizardLayout from './_components/WizardLayout';

type Props = PropsWithChildren<{
	params: Promise<{ id: string }>;
}>;

export default async function ApplyWizardLayout({ children, params }: Props) {
	const session = await auth();

	if (!session?.user) {
		redirect('/auth/login?callbackUrl=/apply/new');
	}

	const { id } = await params;
	const applicant = await getApplicant(id);

	if (!applicant) {
		return notFound();
	}

	if (applicant.userId !== session.user.id) {
		redirect('/apply/new');
	}

	return (
		<WizardLayout applicantId={applicant.id} applicantName={applicant.fullName}>
			{children}
		</WizardLayout>
	);
}
