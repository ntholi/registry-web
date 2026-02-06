'use client';

import { getSponsoredStudent } from '@finance/sponsors';
import {
	Alert,
	Badge,
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
import type { StudentModuleStatus } from '@registry/_database';
import {
	determineSemesterStatus,
	getRegistrationRequest,
	getStudentSemesterModules,
	updateRegistration,
} from '@registry/registration/requests';
import {
	IconArrowLeft,
	IconArrowRight,
	IconInfoCircle,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getBlockedStudentByStdNo } from '@/app/registry/blocked-students';
import { config } from '@/config';
import { useActiveTerm } from '@/shared/lib/hooks/use-active-term';
import useUserStudent from '@/shared/lib/hooks/use-user-student';
import {
	ModuleSelection,
	RemainInSemesterAlert,
	SemesterConfirmation,
	SponsorshipDetailsEdit,
} from '../../_components';

type SelectedModule = {
	moduleId: number;
	moduleStatus: StudentModuleStatus;
};

type SponsorshipData = {
	sponsorId: number;
	borrowerNo?: string;
};

const STEPS = [
	{
		label: 'Update Modules',
		description: 'Modify your selected modules for this semester',
	},
	{
		label: 'Confirm Changes',
		description: 'Review your updated semester status',
	},
	{
		label: 'Update Sponsorship',
		description: 'Update your sponsorship information',
	},
	{
		label: 'Review Changes',
		description: 'Review all changes before submitting',
	},
];

export default function EditRegistrationPage() {
	const router = useRouter();
	const params = useParams();
	const queryClient = useQueryClient();
	const { student, remarks, isLoading: studentLoading } = useUserStudent();
	const [activeStep, setActiveStep] = useState(0);
	const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);
	const [semesterData, setSemesterData] = useState<{
		semesterNo: string;
		status: 'Active' | 'Repeat';
	} | null>(null);
	const [sponsorshipData, setSponsorshipData] =
		useState<SponsorshipData | null>(null);
	const { activeTerm } = useActiveTerm();

	const registrationId = Number(params.id);

	const { data: blockedStudent, isLoading: blockedLoading } = useQuery({
		queryKey: ['blocked-student', student?.stdNo],
		queryFn: async () => {
			if (!student?.stdNo) return null;
			return await getBlockedStudentByStdNo(student.stdNo);
		},
		enabled: !!student?.stdNo,
	});

	const { data: registrationRequest, isLoading: registrationLoading } =
		useQuery({
			queryKey: ['registration-request', registrationId],
			queryFn: () => getRegistrationRequest(registrationId),
			enabled: !!registrationId,
		});

	const { data: moduleResult, isLoading: modulesLoading } = useQuery({
		queryKey: ['student-semester-modules', student?.stdNo, activeTerm?.code],
		queryFn: async () => {
			if (!student || !remarks) {
				return { error: 'Missing student or remarks data', modules: [] };
			}
			return await getStudentSemesterModules(
				student,
				remarks,
				activeTerm?.code
			);
		},
		enabled: !!student && !!remarks && !!activeTerm,
	});

	const availableModules = moduleResult?.modules || [];

	const { data: previousSponsorshipData } = useQuery({
		queryKey: ['previous-sponsorship', student?.stdNo, activeTerm?.id],
		queryFn: () => getSponsoredStudent(student!.stdNo, activeTerm!.id),
		enabled: !!student?.stdNo && !!activeTerm?.id,
	});

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

	const updateMutation = useMutation({
		mutationFn: async () => {
			if (!selectedModules || !semesterData || !sponsorshipData) {
				throw new Error('Missing required data for registration update');
			}

			return updateRegistration(
				registrationId,
				selectedModules.map((module) => ({
					id: module.moduleId,
					status: module.moduleStatus,
				})),
				sponsorshipData,
				semesterData.semesterNo,
				semesterData.status
			);
		},
		onSuccess: () => {
			notifications.show({
				title: 'Registration Updated',
				message: 'Your registration has been updated successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({ queryKey: ['student-registrations'] });
			queryClient.invalidateQueries({
				queryKey: ['registration-request', registrationId],
			});
			router.push('/student-portal/registration');
		},
		onError: (error) => {
			notifications.show({
				title: 'Update Failed',
				message: error.message || 'Failed to update registration',
				color: 'red',
			});
		},
	});

	useEffect(() => {
		if (registrationRequest && !selectedModules.length) {
			const modules = registrationRequest.requestedModules.map((rm) => ({
				moduleId: rm.semesterModule.id,
				moduleStatus: rm.moduleStatus,
			}));
			setSelectedModules(modules);

			setSemesterData({
				semesterNo: registrationRequest.semesterNumber ?? '',
				status: registrationRequest.semesterStatus || 'Active',
			});

			if (
				registrationRequest.sponsoredStudent?.sponsorId &&
				previousSponsorshipData
			) {
				setSponsorshipData({
					sponsorId: registrationRequest.sponsoredStudent.sponsorId,
					borrowerNo: previousSponsorshipData.borrowerNo || undefined,
				});
			}
		}
	}, [registrationRequest, previousSponsorshipData, selectedModules.length]);

	const nextStep = () => {
		if (activeStep === 0 && selectedModules.length > 0) {
			if (semesterStatus && semesterData) {
				setSemesterData({
					semesterNo: semesterData.semesterNo,
					status: semesterStatus.status,
				});
			}
			setActiveStep(1);
		} else if (activeStep === 1 && semesterData) {
			setActiveStep(2);
		}
	};

	const prevStep = () => {
		if (activeStep > 0) {
			setActiveStep(activeStep - 1);
		}
	};

	const handleSubmit = () => {
		if (selectedModules.length > 0 && semesterData && sponsorshipData) {
			updateMutation.mutate();
		}
	};

	const canProceedStep1 =
		selectedModules.length > 0 &&
		selectedModules.length <= config.registry.maxRegModules;
	const canProceedStep2 = semesterData !== null;
	const canSubmit = sponsorshipData !== null;

	const progressValue = ((activeStep + 1) / STEPS.length) * 100;

	if (
		studentLoading ||
		blockedLoading ||
		registrationLoading ||
		!student ||
		!registrationRequest
	) {
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
					Your account has been blocked from registering. Please contact the{' '}
					{blockedStudent.byDepartment} office for assistance.
					<br />
					<strong>Reason:</strong> {blockedStudent.reason}
				</Alert>
			</Container>
		);
	}

	if (!activeTerm) {
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

	if (registrationRequest.status !== 'pending') {
		return (
			<Container size='lg' py='xl'>
				<Alert
					icon={<IconInfoCircle size='1rem' />}
					title='Cannot Edit Registration'
					color='orange'
				>
					You can only edit registrations that are in pending status. This
					registration is currently {registrationRequest.status}.
				</Alert>
			</Container>
		);
	}

	const isRemainInSemester = remarks?.status === 'Remain in Semester';

	const renderStepContent = () => {
		switch (activeStep) {
			case 0:
				if (isRemainInSemester && !modulesLoading) {
					return (
						<Stack gap='lg'>
							<RemainInSemesterAlert
								failedModules={remarks.failedModules}
								supplementaryModules={remarks.supplementaryModules}
								details={remarks.details}
							/>
							{availableModules.length > 0 && (
								<ModuleSelection
									modules={availableModules}
									selectedModules={selectedModules}
									onSelectionChange={setSelectedModules}
									loading={modulesLoading}
								/>
							)}
						</Stack>
					);
				}
				return (
					<ModuleSelection
						modules={availableModules}
						selectedModules={selectedModules}
						onSelectionChange={setSelectedModules}
						loading={modulesLoading}
						error={moduleResult?.error}
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
					<SponsorshipDetailsEdit
						sponsorshipData={sponsorshipData}
						onSponsorshipChange={setSponsorshipData}
						loading={updateMutation.isPending}
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
						Update Registration
					</Title>
					<Group justify='space-between'>
						<Text c='dimmed'>Term: {activeTerm.code}</Text>
						<Badge
							color={
								registrationRequest.status === 'pending' ? 'yellow' : 'blue'
							}
							variant='light'
							size='sm'
							mt='xs'
						>
							{registrationRequest.status.toUpperCase()}
						</Badge>
					</Group>
				</div>

				<Box>
					<Group justify='space-between' mb='sm'>
						<Text size='sm' fw={500}>
							Step {activeStep + 1} of {STEPS.length}
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

				<Box>{renderStepContent()}</Box>

				<Group justify='space-between' mt='xl'>
					<Button
						variant='default'
						onClick={prevStep}
						disabled={activeStep === 0}
						leftSection={<IconArrowLeft size={16} />}
					>
						Back
					</Button>

					{activeStep < 2 ? (
						<Button
							onClick={nextStep}
							disabled={
								(activeStep === 0 && !canProceedStep1) ||
								(activeStep === 1 && !canProceedStep2)
							}
							rightSection={<IconArrowRight size={16} />}
						>
							Next
						</Button>
					) : (
						<Button
							onClick={handleSubmit}
							disabled={!canSubmit}
							loading={updateMutation.isPending}
						>
							Update Registration
						</Button>
					)}
				</Group>
			</Stack>
		</Container>
	);
}
