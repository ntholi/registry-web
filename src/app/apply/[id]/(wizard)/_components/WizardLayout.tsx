'use client';

import {
	Box,
	Group,
	Paper,
	Progress,
	Stack,
	Stepper,
	Text,
	Title,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { usePathname, useRouter } from 'next/navigation';
import { getStepIndex, WIZARD_STEPS } from '../_lib/wizard-steps';

type Props = {
	applicationId: string;
	children: React.ReactNode;
};

export default function WizardLayout({ applicationId, children }: Props) {
	const pathname = usePathname();
	const router = useRouter();
	const isMobile = useMediaQuery('(max-width: 48em)', true);

	const segments = pathname.split('/').filter(Boolean);
	const currentPath = segments[segments.length - 1] ?? 'identity';
	const activeStep = getStepIndex(currentPath);

	function handleStepClick(stepIndex: number) {
		const step = WIZARD_STEPS[stepIndex];
		if (step) {
			router.push(`/apply/${applicationId}/${step.path}`);
		}
	}

	const progressValue = ((activeStep + 1) / WIZARD_STEPS.length) * 100;
	const currentStep = WIZARD_STEPS[activeStep];

	return (
		<Stack gap='xl'>
			<Box>
				<Title order={1}>Application</Title>
				<Text c='dimmed'>Complete all steps to submit your application</Text>
			</Box>

			<Paper withBorder radius='md' p='lg'>
				{isMobile ? (
					<Stack gap='xs'>
						<Stack gap={4}>
							<Text size='sm' fw={500}>
								{currentStep?.label}
							</Text>
							<Group justify='space-between'>
								<Text size='xs' c='dimmed'>
									{currentStep?.description}
								</Text>
								<Text size='xs' c='dimmed'>
									Step {activeStep + 1} of {WIZARD_STEPS.length}
								</Text>
							</Group>
						</Stack>
						<Progress value={progressValue} size='sm' radius='xl' />
					</Stack>
				) : (
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
				)}
			</Paper>

			{children}
		</Stack>
	);
}
