'use client';

import {
	Alert,
	Button,
	Divider,
	Group,
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
	IconCreditCard,
	IconReceipt,
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

const POLL_INTERVAL = 5000;
const TIMEOUT_SECONDS = 90;

type Props = {
	applicationId: string;
	fee: string;
	defaultPhone: string;
	onSwitchToUpload: () => void;
};

export function MobilePayment({
	applicationId,
	fee,
	defaultPhone,
	onSwitchToUpload,
}: Props) {
	const router = useRouter();
	const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
	const [isPolling, setIsPolling] = useState(false);
	const [currentTransactionId, setCurrentTransactionId] = useState<
		string | null
	>(null);
	const [timeRemaining, setTimeRemaining] = useState(TIMEOUT_SECONDS);
	const [paymentError, setPaymentError] = useState<string | null>(null);

	const initiateMutation = useMutation({
		mutationFn: async () =>
			initiateMpesaPayment(applicationId, parseFloat(fee), phoneNumber),
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
				router.push(`/apply/${applicationId}/thank-you`);
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
				router.push(`/apply/${applicationId}/thank-you`);
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
		} catch {
			notifications.show({
				title: 'Invalid Number',
				message: 'Please enter a valid 8-digit phone number',
				color: 'red',
			});
			return;
		}

		initiateMutation.mutate();
	}

	if (isPolling) {
		return (
			<Stack gap='lg'>
				<Group gap='sm'>
					<ThemeIcon size='lg' variant='light' color='blue'>
						<IconCreditCard size={20} />
					</ThemeIcon>
					<Title order={4}>Processing Payment</Title>
				</Group>

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
					<Progress value={(timeRemaining / TIMEOUT_SECONDS) * 100} animated />
				</Stack>
			</Stack>
		);
	}

	return (
		<Stack gap='lg'>
			{paymentError && (
				<Alert
					color='red'
					icon={<IconAlertCircle size={16} />}
					title='Payment Failed'
				>
					{paymentError}
				</Alert>
			)}

			<TextInput
				label='M-Pesa Phone Number'
				value={phoneNumber}
				onChange={(e) => setPhoneNumber(e.currentTarget.value)}
				description='Enter any number with funds in the M-Pesa account to make the payment'
				leftSection={<Text size='sm'>+266</Text>}
				disabled={initiateMutation.isPending}
			/>

			<Alert color='blue' variant='light'>
				<Text size='sm'>
					A USSD prompt will be sent to{' '}
					{phoneNumber ? `+266${phoneNumber}` : 'the number above'}. Enter your
					M-Pesa PIN to authorize the payment of M {fee} to{' '}
					<Text component='span' fw={'bold'}>
						Pay Lesotho
					</Text>
					.
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
				size='md'
				leftSection={<IconCreditCard size={20} />}
				onClick={handleSubmit}
				loading={initiateMutation.isPending}
				disabled={!phoneNumber}
			>
				Pay M {fee} with M-Pesa
			</Button>

			<Divider label='OR' my={'md'} />

			<Button
				variant='subtle'
				color='gray'
				leftSection={<IconReceipt size={16} />}
				onClick={onSwitchToUpload}
			>
				Upload Deposit Slip
			</Button>
		</Stack>
	);
}
