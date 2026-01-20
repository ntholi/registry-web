import type { PropsWithChildren } from 'react';
import WizardLayout from '../_components/WizardLayout';

type Props = PropsWithChildren<{
	params: Promise<{ id: string }>;
}>;

export default async function WizardGroupLayout({ children, params }: Props) {
	const { id } = await params;

	return <WizardLayout applicantId={id}>{children}</WizardLayout>;
}
