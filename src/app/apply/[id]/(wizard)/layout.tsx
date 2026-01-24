'use client';

import { useApplicant } from '@apply/_lib/useApplicant';
import { redirect } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import ApplyLayout from './_components/ApplyLayout';
import WizardLayout from './_components/WizardLayout';

export default function WizardGroupLayout({ children }: PropsWithChildren) {
	const { applicant, isLoading, isSuccess } = useApplicant();

	if (!isLoading && isSuccess && !applicant) {
		redirect('/apply/new');
	}

	return (
		<ApplyLayout>
			<WizardLayout>{children}</WizardLayout>
		</ApplyLayout>
	);
}
