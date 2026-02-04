'use client';

import { findAllSponsors } from '@finance/sponsors';
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
import type { StudentModuleStatus } from '@registry/_database';
import {
	checkIsAdditionalRequest,
	createRegistration,
	determineSemesterStatus,
	getExistingRegistrationSponsorship,
	getStudentSemesterModules,
} from '@registry/registration/requests';
import { canStudentRegister } from '@registry/terms/settings/_server/termRegistrationsActions';
import {
	IconArrowLeft,
	IconArrowRight,
	IconInfoCircle,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getBlockedStudentByStdNo } from '@/app/registry/blocked-students';
import { getActiveProgram } from '@/app/registry/students/_lib/utils';
import { config } from '@/config';
import type { ReceiptType } from '@/core/database';
import { useActiveTerm } from '@/shared/lib/hooks/use-active-term';
import useUserStudent from '@/shared/lib/hooks/use-user-student';
import {
	AccountConfirmation,
	ModuleSelection,
	RemainInSemesterAlert,
	RepeatModuleReceipts,
	SemesterConfirmation,
	SponsorshipDetails,
} from '../_components';

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

const BASE_STEPS = [
	{
		id: 'modules',
		label: 'Select Modules',
		description: 'Choose your modules for this semester',
	},
	{
		id: 'repeat-receipts',
		label: 'Repeat Module Receipts',
		description: 'Provide payment receipts for repeat modules',
	},
	{
		id: 'semester',
		label: 'Confirm Semester',
		description: 'Review your semester status',
	},
	{
		id: 'sponsorship',
		label: 'Sponsorship Details',
		description: 'Enter your sponsorship information',
	},
	{
		id: 'account',
		label: 'Confirm Account',
		description: 'Confirm your account details (NMDS only)',
	},
];

function isValidReceipt(value: string): boolean {
	return /^(PMRC\d{5}|SR-\d{5})$/.test(value);
}

export default function NewRegistrationPage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { student, remarks } = useUserStudent();
	const [stepId, setStepId] = useQueryState('step', {
		defaultValue: 'modules',
		history: 'push',
	});
	const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);
	const [semesterData, setSemesterData] = useState<{
		semesterNo: string;
		status: 'Active' | 'Repeat';
	} | null>(null);
	const [sponsorshipData, setSponsorshipData] =
		useState<SponsorshipData | null>(null);
	const [accountConfirmed, setAccountConfirmed] = useState(false);
	const [repeatModuleReceipts, setRepeatModuleReceipts] = useState<string[]>(
		[]
	);
	const [tuitionFeeReceipts, setTuitionFeeReceipts] = useState<string[]>([]);
	const { activeTerm } = useActiveTerm();

	const activeProgram = getActiveProgram(student);

	const { data: regAccess, isLoading: regAccessLoading } = useQuery({
		queryKey: [
			'can-register',
			activeTerm?.id,
			activeProgram?.schoolId,
			activeProgram?.structure?.program?.id,
		],
		queryFn: () =>
			canStudentRegister(
				activeTerm!.id,
				activeProgram!.schoolId,
				activeProgram!.structure.program.id
			),
		enabled: !!activeTerm?.id && !!activeProgram?.schoolId,
	});

	useEffect(() => {
		if (regAccess && !regAccess.allowed) {
			router.replace('/student-portal/registration');
		}
	}, [regAccess, router]);

	const { data: sponsors } = useQuery({
		queryKey: ['sponsors'],
		queryFn: () => findAllSponsors(1, ''),
		select: (data) => data.items || [],
	});

	const isNMDS = useCallback(
		(sponsorId: number) => {
			if (!sponsors) return false;
			return sponsors.find((s) => s.id === sponsorId)?.name === 'NMDS';
		},
		[sponsors]
	);

	const isPRV = useCallback(
		(sponsorId: number) => {
			if (!sponsors) return false;
			return sponsors.find((s) => s.id === sponsorId)?.code === 'PRV';
		},
		[sponsors]
	);

	const { data: blockedStudent, isLoading: blockedLoading } = useQuery({
		queryKey: ['blocked-student', student?.stdNo],
		queryFn: async () => {
			if (!student?.stdNo) return null;
			return (await getBlockedStudentByStdNo(student.stdNo)) || null;
		},
		enabled: !!student?.stdNo,
	});

	const { data: isAdditionalRequest = false } = useQuery({
		queryKey: ['is-additional-request', student?.stdNo, activeTerm?.id],
		queryFn: async () => {
			if (!student?.stdNo || !activeTerm?.id) return false;
			return await checkIsAdditionalRequest(student.stdNo, activeTerm.id);
		},
		enabled: !!student?.stdNo && !!activeTerm?.id,
	});

	const { data: existingSponsorship } = useQuery({
		queryKey: ['existing-sponsorship', student?.stdNo, activeTerm?.id],
		queryFn: async () => {
			if (!student?.stdNo || !activeTerm?.id) return null;
			return await getExistingRegistrationSponsorship(
				student.stdNo,
				activeTerm.id
			);
		},
		enabled: !!student?.stdNo && !!activeTerm?.id && isAdditionalRequest,
	});

	useEffect(() => {
		if (isAdditionalRequest && existingSponsorship && !sponsorshipData) {
			setSponsorshipData({
				sponsorId: existingSponsorship.sponsorId,
				borrowerNo: existingSponsorship.borrowerNo ?? undefined,
				bankName: existingSponsorship.bankName ?? undefined,
				accountNumber: existingSponsorship.accountNumber ?? undefined,
			});
		}
	}, [isAdditionalRequest, existingSponsorship, sponsorshipData]);

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

	const selectedRepeatModules = useMemo(() => {
		return availableModules.filter(
			(m) =>
				m.status.startsWith('Repeat') &&
				selectedModules.some((sm) => sm.moduleId === m.semesterModuleId)
		);
	}, [availableModules, selectedModules]);

	const hasRepeatModules = selectedRepeatModules.length > 0;

	const isExistingSponsorPRV = existingSponsorship?.sponsorCode === 'PRV';

	const steps = useMemo(() => {
		const result = BASE_STEPS.filter((step) => {
			if (step.id === 'repeat-receipts') {
				return hasRepeatModules;
			}
			if (step.id === 'sponsorship') {
				if (isAdditionalRequest && !isExistingSponsorPRV) {
					return false;
				}
				return true;
			}
			if (step.id === 'account') {
				if (isAdditionalRequest) {
					return false;
				}
				return sponsorshipData?.sponsorId && isNMDS(sponsorshipData.sponsorId);
			}
			return true;
		});
		return result;
	}, [
		hasRepeatModules,
		sponsorshipData?.sponsorId,
		isNMDS,
		isAdditionalRequest,
		isExistingSponsorPRV,
	]);

	const activeStep = useMemo(() => {
		const index = steps.findIndex((s) => s.id === stepId);
		return index >= 0 ? index : 0;
	}, [steps, stepId]);

	const currentStepId = steps[activeStep]?.id;
	const totalSteps = steps.length;

	useEffect(() => {
		if (currentStepId && currentStepId !== stepId) {
			setStepId(currentStepId);
		}
	}, [currentStepId, stepId, setStepId]);

	const handleRemoveRepeatModule = (moduleId: number) => {
		setSelectedModules((prev) => prev.filter((m) => m.moduleId !== moduleId));
	};

	const buildReceiptsPayload = (): {
		receiptNo: string;
		receiptType: ReceiptType;
	}[] => {
		const receipts: { receiptNo: string; receiptType: ReceiptType }[] = [];

		const validRepeatReceipts = repeatModuleReceipts.filter(isValidReceipt);
		for (const receiptNo of validRepeatReceipts) {
			receipts.push({ receiptNo, receiptType: 'repeat_module' });
		}

		if (sponsorshipData?.sponsorId && isPRV(sponsorshipData.sponsorId)) {
			const validTuitionReceipts = tuitionFeeReceipts.filter(isValidReceipt);
			for (const receiptNo of validTuitionReceipts) {
				receipts.push({ receiptNo, receiptType: 'tuition_fee' });
			}
		}

		return receipts;
	};

	const registrationMutation = useMutation({
		mutationFn: async () => {
			if (
				!student ||
				!selectedModules ||
				!semesterData ||
				!sponsorshipData ||
				!activeTerm
			) {
				throw new Error('Missing required data for registration');
			}

			return createRegistration({
				stdNo: student.stdNo,
				modules: selectedModules,
				sponsorId: sponsorshipData.sponsorId,
				semesterNumber: semesterData.semesterNo,
				semesterStatus: semesterData.status,
				borrowerNo: sponsorshipData.borrowerNo,
				bankName: sponsorshipData.bankName,
				accountNumber: sponsorshipData.accountNumber,
				termId: activeTerm.id,
				receipts: buildReceiptsPayload(),
			});
		},
		onSuccess: () => {
			notifications.show({
				title: 'Registration Successful',
				message: 'Your registration request has been submitted successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({ queryKey: ['student-registrations'] });
			router.push('/student-portal/registration');
		},
		onError: (error) => {
			notifications.show({
				title: 'Registration Failed',
				message: error.message || 'Failed to submit registration',
				color: 'red',
			});
		},
	});

	const canProceedFromCurrentStep = (): boolean => {
		switch (currentStepId) {
			case 'modules':
				return (
					selectedModules.length > 0 &&
					selectedModules.length <= config.registry.maxRegModules
				);
			case 'semester':
				return semesterData !== null;
			case 'repeat-receipts': {
				const validReceipts = repeatModuleReceipts.filter(isValidReceipt);
				return validReceipts.length > 0;
			}
			case 'sponsorship': {
				if (!sponsorshipData) return false;
				if (isPRV(sponsorshipData.sponsorId)) {
					const validTuitionReceipts =
						tuitionFeeReceipts.filter(isValidReceipt);
					return validTuitionReceipts.length > 0;
				}
				return true;
			}
			case 'account':
				return accountConfirmed;
			default:
				return false;
		}
	};

	const nextStep = () => {
		if (currentStepId === 'modules' && selectedModules.length > 0) {
			if (semesterStatus) {
				setSemesterData(semesterStatus);
			}
		}
		if (activeStep < totalSteps - 1) {
			const nextStepId = steps[activeStep + 1]?.id;
			if (nextStepId) {
				setStepId(nextStepId);
			}
		}
	};

	const prevStep = () => {
		if (activeStep > 0) {
			const prevStepId = steps[activeStep - 1]?.id;
			if (prevStepId) {
				setStepId(prevStepId);
			}
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

	const isLastStep = activeStep === totalSteps - 1;
	const progressValue = ((activeStep + 1) / totalSteps) * 100;

	if (blockedLoading || regAccessLoading) {
		return (
			<Container size='lg' py='xl'>
				<LoadingOverlay visible />
			</Container>
		);
	}

	if (regAccess && !regAccess.allowed) {
		return (
			<Container size='lg' py='xl'>
				<Alert
					icon={<IconInfoCircle size='1rem' />}
					title='Registration Not Available'
					color='orange'
				>
					{regAccess.reason || 'You are not eligible to register at this time.'}
				</Alert>
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

	const isRemainInSemester = remarks?.status === 'Remain in Semester';

	const renderStepContent = () => {
		switch (currentStepId) {
			case 'modules':
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
			case 'semester':
				return (
					<SemesterConfirmation
						semesterData={semesterData}
						selectedModules={selectedModules}
						availableModules={availableModules}
						loading={semesterStatusLoading}
					/>
				);
			case 'repeat-receipts':
				return (
					<RepeatModuleReceipts
						repeatModules={selectedRepeatModules}
						receipts={repeatModuleReceipts}
						onReceiptsChange={setRepeatModuleReceipts}
						onRemoveModule={handleRemoveRepeatModule}
					/>
				);
			case 'sponsorship':
				return (
					<SponsorshipDetails
						sponsorshipData={sponsorshipData}
						onSponsorshipChange={setSponsorshipData}
						tuitionFeeReceipts={tuitionFeeReceipts}
						onTuitionFeeReceiptsChange={setTuitionFeeReceipts}
						loading={registrationMutation.isPending}
						isAdditionalRequest={isAdditionalRequest}
					/>
				);
			case 'account':
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

	const currentStep = steps[activeStep];

	return (
		<Container size='md'>
			<Stack gap='xl'>
				<div>
					<Title order={2} mb='xs'>
						New Registration
					</Title>
					<Text c='dimmed'>Term: {activeTerm.code}</Text>
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
							{currentStep?.label}
						</Text>
						<Text size='sm' c='dimmed'>
							{currentStep?.description}
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

					{!isLastStep ? (
						<Button
							onClick={nextStep}
							disabled={!canProceedFromCurrentStep()}
							rightSection={<IconArrowRight size={16} />}
						>
							Next
						</Button>
					) : (
						<Button
							onClick={handleSubmit}
							disabled={!canProceedFromCurrentStep()}
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
