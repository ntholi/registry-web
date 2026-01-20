'use client';

import {
	Box,
	Container,
	Paper,
	Stack,
	Stepper,
	Text,
	Title,
	useMantineColorScheme,
} from '@mantine/core';
import { usePathname, useRouter } from 'next/navigation';
import { getStepIndex, WIZARD_STEPS } from '../_lib/wizard-steps';

type Props = {
	applicantId: string;
	applicantName: string;
};

export default function WizardLayout({
	applicantId,
	applicantName,
	children,
}: Props & { children: React.ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const { colorScheme } = useMantineColorScheme();
	const isDark = colorScheme === 'dark';

	const segments = pathname.split('/').filter(Boolean);
	const currentPath = segments[segments.length - 1] ?? 'profile';
	const activeStep = getStepIndex(currentPath);

	function handleStepClick(stepIndex: number) {
		const step = WIZARD_STEPS[stepIndex];
		if (step) {
			router.push(`/apply/${applicantId}/${step.path}`);
		}
	}

	return (
		<Box mih='100vh' bg={isDark ? 'dark.8' : 'gray.0'}>
			<Header isDark={isDark} applicantName={applicantName} />

			<Container size='lg' py='xl' pt={100}>
				<Stack gap='xl'>
					<Stack gap='xs'>
						<Title order={1}>Application</Title>
						<Text c='dimmed'>
							Complete all steps to submit your application
						</Text>
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
			</Container>
		</Box>
	);
}

type HeaderProps = {
	isDark: boolean;
	applicantName: string;
};

function Header({ isDark, applicantName }: HeaderProps) {
	return (
		<Box
			component='header'
			py='md'
			px='xl'
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				zIndex: 100,
				backgroundColor: isDark
					? 'var(--mantine-color-dark-7)'
					: 'var(--mantine-color-white)',
				borderBottom: `1px solid ${
					isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-2)'
				}`,
			}}
		>
			<Container size='lg'>
				<Box
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
					}}
				>
					<Text fw={700} size='lg'>
						Limkokwing
					</Text>
					<Text size='sm' c='dimmed'>
						{applicantName}
					</Text>
				</Box>
			</Container>
		</Box>
	);
}
