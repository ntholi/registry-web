'use client';

import {
	Box,
	Button,
	Group,
	Paper,
	Progress,
	Stack,
	Stepper,
	Text,
	Title,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconEye } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { checkWizardCompleteness } from '../_lib/wizard-completeness';
import { getStepIndex, WIZARD_STEPS } from '../_lib/wizard-steps';

type Props = {
	applicantId: string;
	children: React.ReactNode;
};

export default function WizardLayout({ applicantId, children }: Props) {
	const pathname = usePathname();
	const router = useRouter();
	const isMobile = useMediaQuery('(max-width: 48em)');

	const segments = pathname.split('/').filter(Boolean);
	const currentPath = segments[segments.length - 1] ?? 'documents';
	const activeStep = getStepIndex(currentPath);

	const { data: completeness } = useQuery({
		queryKey: ['wizard-completeness', applicantId],
		queryFn: () => checkWizardCompleteness(applicantId),
	});

	function handleStepClick(stepIndex: number) {
		const step = WIZARD_STEPS[stepIndex];
		if (step) {
			router.push(`/apply/${applicantId}/${step.path}`);
		}
	}

	function handleReviewClick() {
		router.push(`/apply/${applicantId}/review`);
	}

	const isComplete = completeness?.isComplete ?? false;
	const progressValue = ((activeStep + 1) / WIZARD_STEPS.length) * 100;
	const currentStep = WIZARD_STEPS[activeStep];
	const isNotOnReviewOrPayment =
		currentPath !== 'review' && currentPath !== 'payment';

	return (
		<Stack gap='xl'>
			<Stack gap='xs'>
				<Group justify='space-between' align='flex-start'>
					<Box>
						<Title order={1}>Application</Title>
						<Text c='dimmed'>
							Complete all steps to submit your application
						</Text>
					</Box>
					{isComplete && isNotOnReviewOrPayment && (
						<Button
							variant='filled'
							leftSection={<IconEye size={16} />}
							onClick={handleReviewClick}
						>
							Review
						</Button>
					)}
				</Group>
			</Stack>

			<Paper withBorder radius='md' p='lg'>
				{isMobile ? (
					<Stack gap='xs'>
						<Group justify='space-between'>
							<Text size='sm' fw={500}>
								{currentStep?.label}
							</Text>
							<Text size='xs' c='dimmed'>
								Step {activeStep + 1} of {WIZARD_STEPS.length}
							</Text>
						</Group>
						<Progress value={progressValue} size='sm' radius='xl' />
						<Text size='xs' c='dimmed'>
							{currentStep?.description}
						</Text>
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
