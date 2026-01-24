'use client';

import { useApplicant } from '@apply/_lib/useApplicant';
import {
	Alert,
	Button,
	Card,
	Divider,
	Group,
	Paper,
	Progress,
	Stack,
	Text,
	TextInput,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
	IconAlertCircle,
	IconArrowLeft,
	IconCheck,
	IconCreditCard,
	IconRefresh,
} from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useEffect, useState } from 'react';
import {
	normalizePhoneNumber,
	validateMpesaNumber,
} from '@/core/integrations/pay-lesotho';
import { checkPaymentStatus, initiateMpesaPayment } from '../_server/actions';

type Transaction = {
	id: string;
	status: string;
	amount: string;
	mobileNumber: string;
	receiptNumber: string | null;
};

type Props = {
	fee: string | null;
	isPaid: boolean;
	pendingTransaction?: Transaction | null;
};

const POLL_INTERVAL = 5000;
const TIMEOUT_SECONDS = 90;

export default function PaymentForm({
	fee,
	isPaid,
	pendingTransaction,
}: Props) {
	const router = useRouter();
	const { applicant } = useApplicant();
	const applicantId = applicant?.id ?? '';

	const defaultPhone =
		applicant?.phones?.find((p) => {
			try {
				return validateMpesaNumber(p.phoneNumber);
			} catch {
				return false;
			}
		})?.phoneNumber || '';

	const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
	const [isPolling, setIsPolling] = useState(false);
	const [currentTransactionId, setCurrentTransactionId] = useState<
		string | null
	>(pendingTransaction?.id || null);
	const [timeRemaining, setTimeRemaining] = useState(TIMEOUT_SECONDS);
	const [paymentError, setPaymentError] = useState<string | null>(null);

	const initiateMutation = useMutation({
		mutationFn: async () => {
			if (!fee) throw new Error('Fee not available');
			return initiateMpesaPayment(applicantId, parseFloat(fee), phoneNumber);
		},
		onSuccess: (result) => {
			if (result.success && result.transactionId) {
				setCurrentTransactionId(result.transactionId);
				setIsPolling(true);
				setTimeRemaining(TIMEOUT_SECONDS);
				setPaymentError(null);
				notifications.show({
					title: 'Payment Initiated',
					message: result.message || 'Check your phone for USSD prompt',
					color: 'blue',
				});
			} else if (result.isDuplicate) {
				notifications.show({
					title: 'Already Paid',
					message: 'Your application fee has already been paid',
					color: 'yellow',
				});
				router.push('/apply/wizard/thank-you');
			} else {
				setPaymentError(result.error || 'Payment initiation failed');
				notifications.show({
					title: 'Payment Failed',
					message: result.error || 'Failed to initiate payment',
					color: 'red',
				});
			}
		},
		onError: (error: Error) => {
			setPaymentError(error.message);
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	const verifyMutation = useMutation({
		mutationFn: async (txId: string) => checkPaymentStatus(txId),
		onSuccess: (result) => {
			if (result.success && result.status === 'success') {
				setIsPolling(false);
				notifications.show({
					title: 'Payment Successful',
					message: 'Your application fee has been paid',
					color: 'green',
				});
				router.push('/apply/wizard/thank-you');
			} else if (result.status === 'failed') {
				setIsPolling(false);
				setPaymentError('Payment was declined or failed');
			}
		},
	});

	useEffect(() => {
		if (!isPolling || !currentTransactionId) return;

		const interval = setInterval(() => {
			verifyMutation.mutate(currentTransactionId);
		}, POLL_INTERVAL);

		const timeout = setInterval(() => {
			setTimeRemaining((prev) => {
				if (prev <= 1) {
					setIsPolling(false);
					setPaymentError('Payment timed out. Please try again.');
					clearInterval(interval);
					clearInterval(timeout);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => {
			clearInterval(interval);
			clearInterval(timeout);
		};
	}, [isPolling, currentTransactionId, verifyMutation.mutate]);

	function handleBack() {
		router.push('/apply/wizard/review');
	}

	function handleSkip() {
		router.push('/apply/wizard/thank-you');
	}

	function handleRetry() {
		setPaymentError(null);
		setCurrentTransactionId(null);
		setTimeRemaining(TIMEOUT_SECONDS);
	}

	function handleSubmit() {
		try {
			normalizePhoneNumber(phoneNumber);
			if (!validateMpesaNumber(phoneNumber)) {
				notifications.show({
					title: 'Invalid Number',
					message: 'M-Pesa numbers must start with 5',
					color: 'red',
				});
				return;
			}
		} catch (_error) {
			notifications.show({
				title: 'Invalid Number',
				message: 'Please enter a valid 8-digit phone number',
				color: 'red',
			});
			return;
		}

		initiateMutation.mutate();
	}

	if (isPaid) {
		return (
			<Stack gap='lg'>
				<Paper withBorder radius='md' p='lg'>
					<Stack align='center' gap='md'>
						<ThemeIcon size={60} radius='xl' color='green'>
							<IconCheck size={32} />
						</ThemeIcon>
						<Title order={3}>Payment Complete</Title>
						<Text c='dimmed'>Your application fee has been paid</Text>
						<Button onClick={() => router.push('/apply/wizard/thank-you')}>
							Continue
						</Button>
					</Stack>
				</Paper>
			</Stack>
		);
	}

	return (
		<Stack gap='lg'>
			<Paper withBorder radius='md' p='lg'>
				<Stack gap='lg'>
					<Group gap='sm'>
						<ThemeIcon size='lg' variant='light'>
							<IconCreditCard size={20} />
						</ThemeIcon>
						<Title order={4}>Application Fee Payment</Title>
					</Group>

					<Card withBorder radius='md' p='md'>
						<Group justify='space-between'>
							<Text size='sm' c='dimmed'>
								Application Fee
							</Text>
							<Text size='xl' fw={700}>
								M {fee || '0.00'}
							</Text>
						</Group>
					</Card>

					{paymentError && (
						<Alert
							color='red'
							icon={<IconAlertCircle size={16} />}
							title='Payment Failed'
						>
							{paymentError}
						</Alert>
					)}

					{isPolling ? (
						<Stack gap='md'>
							<Alert color='blue' icon={<IconCreditCard size={16} />}>
								<Stack gap='xs'>
									<Text size='sm' fw={500}>
										Waiting for payment confirmation...
									</Text>
									<Text size='xs' c='dimmed'>
										Enter your M-Pesa PIN on your phone to authorize the payment
									</Text>
								</Stack>
							</Alert>

							<Stack gap='xs'>
								<Group justify='space-between'>
									<Text size='sm'>Time remaining</Text>
									<Text size='sm' fw={500}>
										{Math.floor(timeRemaining / 60)}:
										{(timeRemaining % 60).toString().padStart(2, '0')}
									</Text>
								</Group>
								<Progress
									value={(timeRemaining / TIMEOUT_SECONDS) * 100}
									animated
								/>
							</Stack>
						</Stack>
					) : (
						<>
							<TextInput
								label='M-Pesa Phone Number'
								placeholder='59146563'
								value={phoneNumber}
								onChange={(e) => setPhoneNumber(e.currentTarget.value)}
								description='Enter your M-Pesa number (must start with 5)'
								leftSection={<Text size='sm'>+266</Text>}
								disabled={initiateMutation.isPending}
							/>

							<Alert color='blue' variant='light'>
								<Text size='sm'>
									A USSD prompt will be sent to your phone. Enter your M-Pesa
									PIN to authorize the payment.
								</Text>
							</Alert>

							{paymentError && (
								<Button
									variant='outline'
									leftSection={<IconRefresh size={16} />}
									onClick={handleRetry}
								>
									Retry Payment
								</Button>
							)}

							<Button
								color='red'
								leftSection={<IconCreditCard size={20} />}
								onClick={handleSubmit}
								loading={initiateMutation.isPending}
								disabled={!phoneNumber || !fee}
							>
								Pay M {fee || '0.00'} with M-Pesa
							</Button>

							<Divider label='or' labelPosition='center' />

							<Text variant='light' c='gray' size='sm' ta='center'>
								Ecocash - Coming Soon
							</Text>
						</>
					)}
				</Stack>
			</Paper>

			<Divider />

			<Group justify='space-between'>
				<Button
					variant='subtle'
					leftSection={<IconArrowLeft size={16} />}
					onClick={handleBack}
					disabled={isPolling}
				>
					Back
				</Button>
				<Button variant='light' onClick={handleSkip} disabled={isPolling}>
					Skip for now
				</Button>
			</Group>
		</Stack>
	);
}
