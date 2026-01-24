'use client';

import { useApplicant } from '@apply/_lib/useApplicant';
import type { PropsWithChildren } from 'react';
import WizardLayout from '../_components/WizardLayout';

export default function WizardGroupLayout({ children }: PropsWithChildren) {
	const { applicant } = useApplicant();
	const applicantId = applicant?.id ?? '';

	return <WizardLayout applicantId={applicantId}>{children}</WizardLayout>;
}
