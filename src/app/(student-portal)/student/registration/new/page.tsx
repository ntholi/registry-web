'use client';

import { getBlockedStudentByStdNo } from '@finance/blocked-students/server';
import { findAllSponsors } from '@finance/sponsors/server';
import {
	Alert,
	Box,
	Button,
	Container,
	Group,
	LoadingOverlay,
	Progress,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
	createRegistrationWithModules,
	determineSemesterStatus,
	getStudentSemesterModules,
} from '@registry/registration/requests/server';
import {
	AccountConfirmation,
	ModuleSelection,
	SemesterConfirmation,
	SponsorshipDetails,
} from '@student-portal/registration';
import {
	IconArrowLeft,
	IconArrowRight,
	IconInfoCircle,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { StudentModuleStatus } from '@/core/database/schema';
import { MAX_REG_MODULES } from '@/modules/registry/shared/constants';
import { useCurrentTerm } from '@/shared/lib/hooks/use-current-term';
import useUserStudent from '@/shared/lib/hooks/use-user-student';

type SelectedModule = {
	moduleId: number;
	moduleStatus: StudentModuleStatus;
};

type SponsorshipData = {
	sponsorId: number;
	borrowerNo?: string;
	bankName?: string;
	accountNumber?: string;
};

const STEPS = [
	{
		label: 'Select Modules',
		description: 'Choose your modules for this semester',
	},
	{ label: 'Confirm Semester', description: 'Review your semester status' },
	{
		label: 'Sponsorship Details',
		description: 'Enter your sponsorship information',
	},
	{
		label: 'Confirm Account',
		description: 'Confirm your account details (NMDS only)',
	},
];

export default function NewRegistrationPage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { student, remarks } = useUserStudent();
	const [activeStep, setActiveStep] = useState(0);
	const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);
	const [semesterData, setSemesterData] = useState<{
		semesterNo: string;
		status: 'Active' | 'Repeat';
	} | null>(null);
	const [sponsorshipData, setSponsorshipData] =
		useState<SponsorshipData | null>(null);
	const [accountConfirmed, setAccountConfirmed] = useState(false);
	const { currentTerm } = useCurrentTerm();

	const { data: sponsors } = useQuery({
		queryKey: ['sponsors'],
		queryFn: () => findAllSponsors(1, ''),
		select: (data) => data.items || [],
	});

	const isNMDS = (sponsorId: number) => {
		if (!sponsors) return false;
		return sponsors.find((s) => s.id === sponsorId)?.name === 'NMDS';
	};

	const { data: blockedStudent, isLoading: blockedLoading } = useQuery({
		queryKey: ['blocked-student', student?.stdNo],
		queryFn: async () => {
			if (!student?.stdNo) return null;
			return (await getBlockedStudentByStdNo(student.stdNo)) || null;
		},
		enabled: !!student?.stdNo,
	});

	const { data: moduleResult, isLoading: modulesLoading } = useQuery({
		queryKey: ['student-semester-modules', student?.stdNo],
		queryFn: async () => {
			if (!student || !remarks) {
				return { error: 'Missing student or remarks data', modules: [] };
			}
			return await getStudentSemesterModules(student, remarks);
		},
		enabled: !!student && !!remarks,
	});

	const availableModules = moduleResult?.modules || [];

	const { data: semesterStatus, isLoading: semesterStatusLoading } = useQuery({
		queryKey: ['semester-status', selectedModules],
		queryFn: async () => {
			if (!student || !availableModules || selectedModules.length === 0) {
				return null;
			}
			const modulesWithStatus = availableModules.filter((module) =>
				selectedModules.some(
					(selected) => selected.moduleId === module.semesterModuleId
				)
			);
			return await determineSemesterStatus(modulesWithStatus, student);
		},
		enabled: !!student && !!availableModules && selectedModules.length > 0,
	});

	const registrationMutation = useMutation({
		mutationFn: async () => {
			if (
				!student ||
				!selectedModules ||
				!semesterData ||
				!sponsorshipData ||
				!currentTerm
			) {
				throw new Error('Missing required data for registration');
			}

			return createRegistrationWithModules({
				stdNo: student.stdNo,
				modules: selectedModules,
				sponsorId: sponsorshipData.sponsorId,
				semesterNumber: semesterData.semesterNo,
				semesterStatus: semesterData.status,
				borrowerNo: sponsorshipData.borrowerNo,
				bankName: sponsorshipData.bankName,
				accountNumber: sponsorshipData.accountNumber,
				termId: currentTerm.id,
			});
		},
		onSuccess: () => {
			notifications.show({
				title: 'Registration Successful',
				message: 'Your registration request has been submitted successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({ queryKey: ['student-registrations'] });
			router.push('/student/registration');
		},
		onError: (error) => {
			notifications.show({
				title: 'Registration Failed',
				message: error.message || 'Failed to submit registration',
				color: 'red',
			});
		},
	});

	const nextStep = () => {
		if (activeStep === 0 && selectedModules.length > 0) {
			if (semesterStatus) {
				setSemesterData(semesterStatus);
			}
			setActiveStep(1);
		} else if (activeStep === 1 && semesterData) {
			setActiveStep(2);
		} else if (activeStep === 2 && sponsorshipData) {
			if (sponsorshipData.sponsorId && isNMDS(sponsorshipData.sponsorId)) {
				setActiveStep(3);
			} else {
				handleSubmit();
			}
		}
	};

	const prevStep = () => {
		if (activeStep > 0) {
			setActiveStep(activeStep - 1);
		}
	};

	const handleSubmit = () => {
		if (selectedModules.length > 0 && semesterData && sponsorshipData) {
			const needsConfirmation =
				sponsorshipData.sponsorId && isNMDS(sponsorshipData.sponsorId);

			if (needsConfirmation && !accountConfirmed) {
				return;
			}

			registrationMutation.mutate();
		}
	};

	const canProceedStep1 =
		selectedModules.length > 0 && selectedModules.length <= MAX_REG_MODULES;
	const canProceedStep2 = semesterData !== null;
	const canProceedStep3 = sponsorshipData !== null;
	const canSubmit =
		sponsorshipData !== null &&
		(!isNMDS(sponsorshipData?.sponsorId || 0) || accountConfirmed);

	const totalSteps =
		sponsorshipData?.sponsorId && isNMDS(sponsorshipData.sponsorId)
			? STEPS.length
			: STEPS.length - 1;

	const progressValue = ((activeStep + 1) / totalSteps) * 100;

	if (blockedLoading) {
		return (
			<Container size='lg' py='xl'>
				<LoadingOverlay visible />
			</Container>
		);
	}

	if (blockedStudent && blockedStudent.status === 'blocked') {
		return (
			<Container size='lg' py='xl'>
				<Alert
					icon={<IconInfoCircle size='1rem' />}
					title='Registration Blocked'
					color='red'
				>
					Your account has been blocked from registering. Please contact the
					registry office for assistance.
					<br />
					<strong>Reason:</strong> {blockedStudent.reason}
				</Alert>
			</Container>
		);
	}

	if (!currentTerm) {
		return (
			<Container size='lg' py='xl'>
				<Alert
					icon={<IconInfoCircle size='1rem' />}
					title='No Active Term'
					color='orange'
				>
					There is currently no active registration term.
				</Alert>
			</Container>
		);
	}

	const renderStepContent = () => {
		switch (activeStep) {
			case 0:
				return (
					<ModuleSelection
						modules={availableModules}
						selectedModules={selectedModules}
						onSelectionChange={setSelectedModules}
						loading={modulesLoading}
					/>
				);
			case 1:
				return (
					<SemesterConfirmation
						semesterData={semesterData}
						selectedModules={selectedModules}
						availableModules={availableModules}
						loading={semesterStatusLoading}
					/>
				);
			case 2:
				return (
					<SponsorshipDetails
						sponsorshipData={sponsorshipData}
						onSponsorshipChange={setSponsorshipData}
						loading={registrationMutation.isPending}
					/>
				);
			case 3:
				return (
					<AccountConfirmation
						sponsorshipData={sponsorshipData}
						onConfirmationChange={setAccountConfirmed}
						loading={registrationMutation.isPending}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<Container size='md'>
			<Stack gap='xl'>
				<div>
					<Title order={2} mb='xs'>
						New Registration
					</Title>
					<Text c='dimmed'>Term: {currentTerm.name}</Text>
				</div>

				<Box>
					<Group justify='space-between' mb='sm'>
						<Text size='sm' fw={500}>
							Step {activeStep + 1} of {totalSteps}
						</Text>
					</Group>

					<Progress value={progressValue} size='lg' mb='md' />

					<Box>
						<Text fw={500} size='lg'>
							{STEPS[activeStep].label}
						</Text>
						<Text size='sm' c='dimmed'>
							{STEPS[activeStep].description}
						</Text>
					</Box>
				</Box>

				{/* Step Content */}
				<Box>{renderStepContent()}</Box>

				{/* Navigation */}
				<Group justify='space-between' mt='xl'>
					<Button
						variant='default'
						onClick={prevStep}
						disabled={activeStep === 0}
						leftSection={<IconArrowLeft size={16} />}
					>
						Back
					</Button>

					{activeStep < totalSteps - 1 ? (
						<Button
							onClick={nextStep}
							disabled={
								(activeStep === 0 && !canProceedStep1) ||
								(activeStep === 1 && !canProceedStep2) ||
								(activeStep === 2 && !canProceedStep3)
							}
							rightSection={<IconArrowRight size={16} />}
						>
							Next
						</Button>
					) : (
						<Button
							onClick={handleSubmit}
							disabled={!canSubmit}
							loading={registrationMutation.isPending}
						>
							Submit Registration
						</Button>
					)}
				</Group>
			</Stack>
		</Container>
	);
}
