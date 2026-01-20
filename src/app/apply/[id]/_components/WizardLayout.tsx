'use client';

import { Paper, Stack, Stepper, Text, Title } from '@mantine/core';
import { usePathname, useRouter } from 'next/navigation';
import { getStepIndex, WIZARD_STEPS } from '../_lib/wizard-steps';

type Props = {
	applicantId: string;
	children: React.ReactNode;
};

export default function WizardLayout({ applicantId, children }: Props) {
	const pathname = usePathname();
	const router = useRouter();

	const segments = pathname.split('/').filter(Boolean);
	const currentPath = segments[segments.length - 1] ?? 'documents';
	const activeStep = getStepIndex(currentPath);

	function handleStepClick(stepIndex: number) {
		const step = WIZARD_STEPS[stepIndex];
		if (step) {
			router.push(`/apply/${applicantId}/${step.path}`);
		}
	}

	return (
		<Stack gap='xl'>
			<Stack gap='xs'>
				<Title order={1}>Application</Title>
				<Text c='dimmed'>Complete all steps to submit your application</Text>
			</Stack>

			<Paper withBorder radius='md' p='lg'>
				<Stepper
					active={activeStep}
					onStepClick={handleStepClick}
					allowNextStepsSelect={false}
					size='sm'
				>
					{WIZARD_STEPS.map((step) => (
						<Stepper.Step
							key={step.path}
							label={step.label}
							description={step.description}
						/>
					))}
				</Stepper>
			</Paper>

			{children}
		</Stack>
	);
}
