'use client';

import { useApplicant } from '@apply/_lib/useApplicant';
import {
	Button,
	Card,
	Divider,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Title,
	UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
	IconArrowLeft,
	IconCheck,
	IconCreditCard,
	IconReceipt,
} from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { validateMpesaNumber } from '@/core/integrations/pay-lesotho';
import { submitReceiptPayment } from '../_server/actions';
import { MobilePayment } from './MobilePayment';
import ReceiptUpload from './ReceiptUpload';

type Transaction = {
	id: string;
	status: string;
	amount: string;
	mobileNumber: string;
	receiptNumber: string | null;
};

type Props = {
	applicationId: string;
	fee: string | null;
	isPaid: boolean;
	pendingTransaction?: Transaction | null;
	intakeStartDate: string | null;
	intakeEndDate: string | null;
};

type PaymentView = 'select' | 'mobile' | 'receipt';

export default function PaymentForm({
	applicationId,
	fee,
	isPaid,
	intakeStartDate,
	intakeEndDate,
}: Props) {
	const router = useRouter();
	const { applicant } = useApplicant();
	const [view, setView] = useState<PaymentView>('select');

	const defaultPhone =
		applicant?.phones?.find((p) => {
			try {
				return validateMpesaNumber(p.phoneNumber);
			} catch {
				return false;
			}
		})?.phoneNumber || '';

	const submitReceiptMutation = useMutation({
		mutationFn: async (
			receipts: Array<{
				base64: string;
				mediaType: string;
				receiptNumber: string;
			}>
		) => submitReceiptPayment(applicationId, receipts),
		onSuccess: (result) => {
			if (result.success) {
				notifications.show({
					title: 'Payment Verified',
					message: 'Your receipts have been verified successfully',
					color: 'green',
				});
				router.push(`/apply/${applicationId}/thank-you`);
			} else {
				notifications.show({
					title: 'Verification Failed',
					message: result.error || 'Failed to verify receipts',
					color: 'red',
				});
			}
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	function handleBack() {
		router.push(`/apply/${applicationId}/review`);
	}

	function handleSkip() {
		router.push(`/apply/${applicationId}/thank-you`);
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
						<Button
							onClick={() => router.push(`/apply/${applicationId}/thank-you`)}
						>
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

					{view === 'select' && (
						<SimpleGrid cols={2} spacing='md'>
							<PaymentOption
								icon={<IconCreditCard size={28} />}
								title='Pay with M-Pesa'
								description='Pay instantly using mobile money'
								color='red'
								onClick={() => setView('mobile')}
							/>

							{intakeStartDate && intakeEndDate && fee ? (
								<PaymentOption
									icon={<IconReceipt size={28} />}
									title='Upload Receipt'
									description='Already paid? Upload proof'
									color='teal'
									onClick={() => setView('receipt')}
								/>
							) : (
								<Card withBorder radius='md' p='md'>
									<Stack align='center' justify='center' h='100%' gap='xs'>
										<ThemeIcon
											size={48}
											radius='md'
											variant='light'
											color='gray'
										>
											<IconReceipt size={28} />
										</ThemeIcon>
										<Text size='sm' c='dimmed' ta='center'>
											Receipt upload unavailable
										</Text>
									</Stack>
								</Card>
							)}
						</SimpleGrid>
					)}

					{view === 'mobile' && fee && (
						<MobilePayment
							applicationId={applicationId}
							fee={fee}
							defaultPhone={defaultPhone}
							onBack={() => setView('select')}
						/>
					)}

					{view === 'receipt' && intakeStartDate && intakeEndDate && fee && (
						<ReceiptUpload
							fee={fee}
							intakeStartDate={intakeStartDate}
							intakeEndDate={intakeEndDate}
							onSubmit={(receipts) => submitReceiptMutation.mutate(receipts)}
							onBack={() => setView('select')}
							isSubmitting={submitReceiptMutation.isPending}
						/>
					)}
				</Stack>
			</Paper>

			{view === 'select' && (
				<>
					<Divider />

					<Group justify='space-between'>
						<Button
							variant='subtle'
							leftSection={<IconArrowLeft size={16} />}
							onClick={handleBack}
						>
							Back
						</Button>
						<Button variant='light' onClick={handleSkip}>
							Skip for now
						</Button>
					</Group>
				</>
			)}
		</Stack>
	);
}

type PaymentOptionProps = {
	icon: React.ReactNode;
	title: string;
	description: string;
	color: string;
	onClick: () => void;
};

function PaymentOption({
	icon,
	title,
	description,
	color,
	onClick,
}: PaymentOptionProps) {
	return (
		<UnstyledButton onClick={onClick} w='100%' h='100%'>
			<Card withBorder radius='md' p='lg' h='100%'>
				<Stack align='center' justify='center' gap='sm' h='100%'>
					<ThemeIcon size={56} radius='md' variant='light' color={color}>
						{icon}
					</ThemeIcon>
					<Stack gap={2} align='center'>
						<Text fw={600} ta='center'>
							{title}
						</Text>
						<Text size='xs' c='dimmed' ta='center'>
							{description}
						</Text>
					</Stack>
				</Stack>
			</Card>
		</UnstyledButton>
	);
}
