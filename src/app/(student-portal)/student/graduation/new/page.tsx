'use client';

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
	IconArrowLeft,
	IconArrowRight,
	IconInfoCircle,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { paymentType } from '@/db/schema';
import {
	createGraduationRequestWithPaymentReceipts,
	getEligiblePrograms,
	getGraduationRequestByStudentNo,
} from '@/server/registry/graduation/requests/actions';
import useUserStudent from '@/shared/lib/hooks/use-user-student';
import InformationConfirmation from './InformationConfirmation';
import PaymentReceiptsInput from './PaymentReceiptsInput';
import ProgramSelection from './ProgramSelection';
import ReviewAndSubmit from './ReviewAndSubmit';

type PaymentReceiptData = {
	paymentType: (typeof paymentType.enumValues)[number];
	receiptNo: string;
};

const STEPS = [
	{
		label: 'Select Program',
		description: 'Choose the program you want to graduate from',
	},
	{
		label: 'Confirm Information',
		description: 'Verify your personal information is correct',
	},
	{
		label: 'Payment Receipts',
		description: 'Enter your payment receipt numbers',
	},
	{
		label: 'Review & Submit',
		description: 'Review your information and submit your graduation request',
	},
];

export default function GraduationPage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { student } = useUserStudent();
	const [activeStep, setActiveStep] = useState(0);
	const [selectedProgramId, setSelectedProgramId] = useState<number | null>(
		null
	);
	const [informationConfirmed, setInformationConfirmed] = useState(false);
	const [receipts, setReceipts] = useState<PaymentReceiptData[]>([]);

	const { data: existingRequest, isLoading: checkingExisting } = useQuery({
		queryKey: ['graduation-request', student?.stdNo],
		queryFn: async () => {
			if (!student?.stdNo) return null;
			return await getGraduationRequestByStudentNo(student.stdNo);
		},
		enabled: !!student?.stdNo,
	});

	const { data: eligiblePrograms, isLoading: loadingPrograms } = useQuery({
		queryKey: ['eligible-programs', student?.stdNo],
		queryFn: async () => {
			if (!student?.stdNo) return [];
			return await getEligiblePrograms(student.stdNo);
		},
		enabled: !!student?.stdNo && !existingRequest,
	});

	const graduationMutation = useMutation({
		mutationFn: async () => {
			if (
				!student ||
				!selectedProgramId ||
				!informationConfirmed ||
				receipts.length === 0 ||
				!receipts.every((r) => r.receiptNo.trim() !== '')
			) {
				throw new Error('Missing required data for graduation request');
			}

			const payloadReceipts = receipts.map((r) => ({
				paymentType: r.paymentType!,
				receiptNo: r.receiptNo,
			}));

			return createGraduationRequestWithPaymentReceipts({
				studentProgramId: selectedProgramId,
				informationConfirmed: true,
				paymentReceipts: payloadReceipts,
			});
		},
		onSuccess: () => {
			notifications.show({
				title: 'Graduation Request Submitted',
				message: 'Your graduation request has been submitted successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({ queryKey: ['graduation-request'] });
			router.push('/student/graduation');
		},
		onError: (error) => {
			notifications.show({
				title: 'Submission Failed',
				message: error.message || 'Failed to submit graduation request',
				color: 'red',
			});
		},
	});

	const nextStep = () => {
		if (activeStep === 0 && selectedProgramId) {
			setActiveStep(1);
		} else if (activeStep === 1 && informationConfirmed) {
			setActiveStep(2);
		} else if (activeStep === 2 && receipts.length > 0) {
			setActiveStep(3);
		}
	};

	const prevStep = () => {
		if (activeStep > 0) {
			setActiveStep(activeStep - 1);
		}
	};

	const handleSubmit = () => {
		if (
			selectedProgramId &&
			informationConfirmed &&
			receipts.length > 0 &&
			receipts.every((r) => r.receiptNo.trim() !== '')
		) {
			graduationMutation.mutate();
		}
	};

	const canProceedStep0 = selectedProgramId !== null;
	const canProceedStep1 = informationConfirmed;
	const canProceedStep2 =
		receipts.length > 0 && receipts.every((r) => r.receiptNo.trim() !== '');
	const canSubmit =
		selectedProgramId &&
		informationConfirmed &&
		receipts.length > 0 &&
		receipts.every((r) => r.receiptNo.trim() !== '');

	const progressValue = ((activeStep + 1) / STEPS.length) * 100;

	if (checkingExisting || loadingPrograms) {
		return (
			<Container size='lg' py='xl'>
				<LoadingOverlay visible />
			</Container>
		);
	}

	if (existingRequest) {
		return (
			<Container size='lg' py='xl'>
				<Alert
					icon={<IconInfoCircle size='1rem' />}
					title='Graduation Request Already Submitted'
					color='blue'
				>
					You have already submitted a graduation request. Please check with the
					registry office for the status of your request.
					<br />
					<strong>Submitted on:</strong>{' '}
					{new Date(existingRequest.createdAt || '').toLocaleDateString()}
				</Alert>
			</Container>
		);
	}

	if (!student) {
		return (
			<Container size='lg' py='xl'>
				<Alert
					icon={<IconInfoCircle size='1rem' />}
					title='Student Information Not Found'
					color='red'
				>
					Unable to load your student information. Please contact the registry
					office.
				</Alert>
			</Container>
		);
	}

	const renderStepContent = () => {
		switch (activeStep) {
			case 0:
				return (
					<ProgramSelection
						programs={eligiblePrograms || []}
						selectedProgramId={selectedProgramId}
						onProgramSelect={setSelectedProgramId}
					/>
				);
			case 1:
				return (
					<InformationConfirmation
						student={student}
						selectedProgram={
							eligiblePrograms?.find((p) => p.id === selectedProgramId) || null
						}
						confirmed={informationConfirmed}
						onConfirm={setInformationConfirmed}
					/>
				);
			case 2:
				return (
					<PaymentReceiptsInput
						paymentReceipts={receipts}
						onPaymentReceiptsChange={(r) => setReceipts(r)}
					/>
				);
			case 3:
				return (
					<ReviewAndSubmit
						student={student}
						selectedProgram={eligiblePrograms?.find(
							(p) => p.id === selectedProgramId
						)}
						paymentReceipts={receipts}
						loading={graduationMutation.isPending}
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
						Graduation Request
					</Title>
					<Text c='dimmed'>Submit your graduation clearance request</Text>
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

					{activeStep < STEPS.length - 1 ? (
						<Button
							onClick={nextStep}
							disabled={
								(activeStep === 0 && !canProceedStep0) ||
								(activeStep === 1 && !canProceedStep1) ||
								(activeStep === 2 && !canProceedStep2)
							}
							rightSection={<IconArrowRight size={16} />}
						>
							Next
						</Button>
					) : (
						<Button
							onClick={handleSubmit}
							disabled={!canSubmit}
							loading={graduationMutation.isPending}
						>
							Submit
						</Button>
					)}
				</Group>
			</Stack>
		</Container>
	);
}
