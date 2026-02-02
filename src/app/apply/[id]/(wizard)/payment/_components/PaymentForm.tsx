'use client';

import {
	Button,
	Card,
	Divider,
	Group,
	Modal,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Title,
	UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
	IconAlertTriangle,
	IconArrowLeft,
	IconCheck,
	IconCreditCard,
	IconReceipt,
} from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useQueryState } from 'nuqs';
import { submitReceiptPayment } from '../_server/actions';
import { MobilePayment } from './MobilePayment';
import ReceiptUpload from './ReceiptUpload';

type Props = {
	applicationId: string;
	fee: string | null;
	isPaid: boolean;
	hasPendingDeposit: boolean;
	intakeStartDate: string | null;
	intakeEndDate: string | null;
};

type PaymentView = 'select' | 'mobile' | 'receipt';

export default function PaymentForm({
	applicationId,
	fee,
	isPaid,
	hasPendingDeposit,
	intakeStartDate,
	intakeEndDate,
}: Props) {
	const router = useRouter();
	const [view, setView] = useQueryState('method', {
		defaultValue: 'select' as PaymentView,
		parse: (value): PaymentView => {
			if (value === 'mobile' || value === 'receipt') return value;
			return 'select';
		},
	});

	const [payLaterOpened, { open: openPayLater, close: closePayLater }] =
		useDisclosure(false);

	const submitReceiptMutation = useMutation({
		mutationFn: async (
			receipts: Array<{
				base64: string;
				mediaType: string;
				reference: string;
				beneficiaryName: string | null;
				dateDeposited: string | null;
				amountDeposited: number | null;
				currency: string | null;
				depositorName: string | null;
				bankName: string | null;
				transactionNumber: string | null;
				terminalNumber: string | null;
			}>
		) => submitReceiptPayment(applicationId, receipts),
		onSuccess: (result) => {
			if (result.success) {
				notifications.show({
					title: 'Payment Submitted',
					message:
						'Your deposit slip has been submitted and is pending verification by finance.',
					color: 'blue',
				});
				router.push(`/apply/${applicationId}/thank-you`);
			} else {
				notifications.show({
					title: 'Submission Failed',
					message: result.error || 'Failed to submit deposit slip',
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

	if (hasPendingDeposit) {
		return (
			<Stack gap='lg'>
				<Paper withBorder radius='md' p='lg'>
					<Stack align='center' gap='md'>
						<ThemeIcon size={60} radius='xl' color='blue'>
							<IconCreditCard size={32} />
						</ThemeIcon>
						<Title order={3}>Payment Pending Verification</Title>
						<Text c='dimmed' ta='center'>
							Your bank deposit slip has been submitted and is being reviewed by
							our finance team. You will be notified once verified.
						</Text>
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
						<Title order={4}>Payment</Title>
					</Group>

					<Card withBorder p='md'>
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
						<SimpleGrid cols={1} spacing='md'>
							{intakeStartDate && intakeEndDate && fee ? (
								<PaymentOption
									icon={<IconReceipt size={28} />}
									title='Upload Receipt'
									description='Upload Bank Deposit Slip'
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
							defaultPhone={''}
							onSwitchToUpload={() => setView('receipt')}
						/>
					)}

					{view === 'receipt' && intakeStartDate && intakeEndDate && fee && (
						<ReceiptUpload
							fee={fee}
							intakeStartDate={intakeStartDate}
							intakeEndDate={intakeEndDate}
							onSubmit={(receipts) => submitReceiptMutation.mutate(receipts)}
							isSubmitting={submitReceiptMutation.isPending}
						/>
					)}
				</Stack>
			</Paper>

			<Divider />

			<Group justify='space-between'>
				<Button
					variant='subtle'
					leftSection={<IconArrowLeft size={16} />}
					onClick={handleBack}
				>
					Back
				</Button>
				<Button variant='light' onClick={openPayLater}>
					Pay Later
				</Button>
			</Group>

			<Modal
				opened={payLaterOpened}
				onClose={closePayLater}
				title='Pay Later'
				centered
			>
				<Stack gap='md'>
					<Group gap='sm'>
						<ThemeIcon size='lg' color='orange' variant='light'>
							<IconAlertTriangle size={20} />
						</ThemeIcon>
						<Text fw={500}>Important Notice</Text>
					</Group>
					<Text size='sm' c='dimmed'>
						Your application will <strong>not be processed</strong> until the
						application fee of <strong>M {fee}</strong> is paid. You can return
						later to complete your payment.
					</Text>
					<Group justify='flex-end' mt='sm'>
						<Button variant='default' onClick={closePayLater}>
							Go Back
						</Button>
						<Button color='orange' onClick={handleSkip}>
							Continue Without Paying
						</Button>
					</Group>
				</Stack>
			</Modal>
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
