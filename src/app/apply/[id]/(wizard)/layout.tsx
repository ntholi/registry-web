import type { PropsWithChildren } from 'react';
import ApplyLayout from './_components/ApplyLayout';
import WizardLayout from './_components/WizardLayout';

type Props = PropsWithChildren<{
	params: Promise<{ id: string }>;
}>;

export default async function WizardGroupLayout({ children, params }: Props) {
	const { id } = await params;

	return (
		<ApplyLayout>
			<WizardLayout applicationId={id}>{children}</WizardLayout>
		</ApplyLayout>
	);
}
