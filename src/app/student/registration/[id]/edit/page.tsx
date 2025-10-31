'use client';

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
import { IconArrowLeft, IconArrowRight, IconInfoCircle } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { StudentModuleStatus } from '@/db/schema';
import { useCurrentTerm } from '@/hooks/use-current-term';
import useUserStudent from '@/hooks/use-user-student';
import { MAX_REG_MODULES } from '@/lib/constants';
import { getBlockedStudentByStdNo } from '@/server/blocked-students/actions';
import {
	determineSemesterStatus,
	getRegistrationRequest,
	getStudentSemesterModules,
	updateRegistrationWithModulesAndSponsorship,
} from '@/server/registration/requests/actions';
import { getSponsoredStudent } from '@/server/sponsors/actions';
import ModuleSelection from '../../new/ModuleSelection';
import SemesterConfirmation from '../../new/SemesterConfirmation';
import SponsorshipDetailsEdit from './SponsorshipDetailsEdit';

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
		semesterNo: number;
		status: 'Active' | 'Repeat';
	} | null>(null);
	const [sponsorshipData, setSponsorshipData] = useState<SponsorshipData | null>(null);
	const { currentTerm } = useCurrentTerm();

	const registrationId = Number(params.id);

	const { data: blockedStudent, isLoading: blockedLoading } = useQuery({
		queryKey: ['blocked-student', student?.stdNo],
		queryFn: async () => {
			if (!student?.stdNo) return null;
			return await getBlockedStudentByStdNo(student.stdNo);
		},
		enabled: !!student?.stdNo,
	});

	const { data: registrationRequest, isLoading: registrationLoading } = useQuery({
		queryKey: ['registration-request', registrationId],
		queryFn: () => getRegistrationRequest(registrationId),
		enabled: !!registrationId,
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

	const { data: previousSponsorshipData } = useQuery({
		queryKey: ['previous-sponsorship', student?.stdNo, currentTerm?.id],
		queryFn: () => getSponsoredStudent(student!.stdNo, currentTerm!.id),
		enabled: !!student?.stdNo && !!currentTerm?.id,
	});

	const { data: semesterStatus, isLoading: semesterStatusLoading } = useQuery({
		queryKey: ['semester-status', selectedModules],
		queryFn: async () => {
			if (!student || !availableModules || selectedModules.length === 0) {
				return null;
			}
			const modulesWithStatus = availableModules.filter((module) =>
				selectedModules.some((selected) => selected.moduleId === module.semesterModuleId)
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

			return updateRegistrationWithModulesAndSponsorship(
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
			router.push('/student/registration');
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
				semesterNo: registrationRequest.semesterNumber || 1,
				status: registrationRequest.semesterStatus || 'Active',
			});

			if (registrationRequest.sponsorId && previousSponsorshipData) {
				setSponsorshipData({
					sponsorId: registrationRequest.sponsorId,
					borrowerNo: previousSponsorshipData.borrowerNo || undefined,
				});
			}
		}
	}, [registrationRequest, previousSponsorshipData, selectedModules.length]);

	const nextStep = () => {
		if (activeStep === 0 && selectedModules.length > 0) {
			if (semesterStatus) {
				setSemesterData(semesterStatus);
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

	const canProceedStep1 = selectedModules.length > 0 && selectedModules.length <= MAX_REG_MODULES;
	const canProceedStep2 = semesterData !== null;
	const canSubmit = sponsorshipData !== null;

	const progressValue = ((activeStep + 1) / STEPS.length) * 100;

	if (studentLoading || blockedLoading || registrationLoading || !student || !registrationRequest) {
		return (
			<Container size="lg" py="xl">
				<LoadingOverlay visible />
			</Container>
		);
	}

	if (blockedStudent && blockedStudent.status === 'blocked') {
		return (
			<Container size="lg" py="xl">
				<Alert icon={<IconInfoCircle size="1rem" />} title="Registration Blocked" color="red">
					Your account has been blocked from registering. Please contact the{' '}
					{blockedStudent.byDepartment} office for assistance.
					<br />
					<strong>Reason:</strong> {blockedStudent.reason}
				</Alert>
			</Container>
		);
	}

	if (!currentTerm) {
		return (
			<Container size="lg" py="xl">
				<Alert icon={<IconInfoCircle size="1rem" />} title="No Active Term" color="orange">
					There is currently no active registration term.
				</Alert>
			</Container>
		);
	}

	if (registrationRequest.status !== 'pending') {
		return (
			<Container size="lg" py="xl">
				<Alert
					icon={<IconInfoCircle size="1rem" />}
					title="Cannot Edit Registration"
					color="orange"
				>
					You can only edit registrations that are in pending status. This registration is currently{' '}
					{registrationRequest.status}.
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
		<Container size="md">
			<Stack gap="xl">
				<div>
					<Title order={2} mb="xs">
						Update Registration
					</Title>
					<Group justify="space-between">
						<Text c="dimmed">Term: {currentTerm.name}</Text>
						<Badge
							color={registrationRequest.status === 'pending' ? 'yellow' : 'blue'}
							variant="light"
							size="sm"
							mt="xs"
						>
							{registrationRequest.status.toUpperCase()}
						</Badge>
					</Group>
				</div>

				<Box>
					<Group justify="space-between" mb="sm">
						<Text size="sm" fw={500}>
							Step {activeStep + 1} of {STEPS.length}
						</Text>
					</Group>

					<Progress value={progressValue} size="lg" mb="md" />

					<Box>
						<Text fw={500} size="lg">
							{STEPS[activeStep].label}
						</Text>
						<Text size="sm" c="dimmed">
							{STEPS[activeStep].description}
						</Text>
					</Box>
				</Box>

				<Box>{renderStepContent()}</Box>

				<Group justify="space-between" mt="xl">
					<Button
						variant="default"
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
								(activeStep === 0 && !canProceedStep1) || (activeStep === 1 && !canProceedStep2)
							}
							rightSection={<IconArrowRight size={16} />}
						>
							Next
						</Button>
					) : (
						<Button onClick={handleSubmit} disabled={!canSubmit} loading={updateMutation.isPending}>
							Update Registration
						</Button>
					)}
				</Group>
			</Stack>
		</Container>
	);
}
