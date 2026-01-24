'use client';

import {
	ActionIcon,
	Alert,
	Badge,
	Box,
	Button,
	Card,
	CopyButton,
	Divider,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
	IconAlertCircle,
	IconCheck,
	IconCopy,
	IconCreditCard,
	IconLibrary,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useApplicant } from '@/app/apply/_lib/useApplicant';
import { formatDate } from '@/shared/lib/utils/dates';
import { FieldView } from '@/shared/ui/adease/FieldView';
import { DocumentCardSkeleton } from '@/shared/ui/DocumentCardShell';
import {
	MobileReceiptUpload,
	type ReceiptUploadResult,
} from '@/shared/ui/MobileReceiptUpload';
import { ReceiptUpload as ReceiptDropzone } from '@/shared/ui/ReceiptUpload';
import { validateSingleReceipt } from '../_server/actions';
import { ReceiptCard, type UploadedReceipt } from './ReceiptCard';

type DepositSubmission = {
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
};

type Props = {
	fee: string;
	intakeStartDate: string;
	intakeEndDate: string;
	onSubmit: (receipts: DepositSubmission[]) => void;
	onSwitchToMpesa: () => void;
	isSubmitting?: boolean;
};

function generateId(): string {
	return Math.random().toString(36).slice(2, 11);
}

export default function ReceiptUploadForm({
	fee,
	intakeStartDate,
	intakeEndDate,
	onSubmit,
	onSwitchToMpesa,
	isSubmitting,
}: Props) {
	const isMobile = useMediaQuery('(max-width: 768px)');
	const [uploading, setUploading] = useState(false);
	const [uploadKey, setUploadKey] = useState(0);
	const [receipts, setReceipts] = useState<UploadedReceipt[]>([]);
	const [pendingUploads, setPendingUploads] = useState(0);
	const application = useApplicant();

	const requiredAmount = parseFloat(fee);
	const totalAmount = receipts
		.filter((r) => r.isValid)
		.reduce((sum, r) => sum + (r.amount ?? 0), 0);
	const isAmountSufficient = totalAmount >= requiredAmount;
	const allValid = receipts.every((r) => r.isValid);

	const validReceipts = receipts.filter((r) => r.isValid && r.reference);
	const canSubmit = validReceipts.length > 0 && isAmountSufficient;

	async function handleUploadComplete(result: ReceiptUploadResult) {
		try {
			setUploading(true);
			setPendingUploads((prev) => prev + 1);

			const validation = await validateSingleReceipt(
				result.base64,
				result.file.type,
				intakeStartDate,
				intakeEndDate
			);

			const newReceipt: UploadedReceipt = {
				id: generateId(),
				reference: validation.data?.reference ?? null,
				amount: validation.data?.amountDeposited ?? null,
				dateDeposited: validation.data?.dateDeposited ?? null,
				beneficiaryName: validation.data?.beneficiaryName ?? null,
				currency: validation.data?.currency ?? null,
				depositorName: validation.data?.depositorName ?? null,
				bankName: validation.data?.bankName ?? null,
				transactionNumber: validation.data?.transactionNumber ?? null,
				terminalNumber: validation.data?.terminalNumber ?? null,
				isValid: validation.isValid,
				errors: validation.errors,
				base64: result.base64,
				mediaType: result.file.type,
			};

			setReceipts((prev) => [...prev, newReceipt]);
			setUploadKey((prev) => prev + 1);

			if (validation.isValid) {
				notifications.show({
					title: 'Receipt uploaded',
					message: 'Receipt processed and validated successfully',
					color: 'green',
				});
			} else {
				notifications.show({
					title: 'Receipt validation failed',
					message: validation.errors[0] || 'Receipt is not valid',
					color: 'red',
				});
			}
		} catch (error) {
			notifications.show({
				title: 'Upload failed',
				message: error instanceof Error ? error.message : 'Upload failed',
				color: 'red',
			});
		} finally {
			setUploading(false);
			setPendingUploads((prev) => Math.max(0, prev - 1));
		}
	}

	async function handleDelete(id: string) {
		setReceipts((prev) => prev.filter((r) => r.id !== id));
	}

	function handleSubmit() {
		if (!canSubmit) return;
		onSubmit(
			validReceipts.map((r) => ({
				base64: r.base64,
				mediaType: r.mediaType,
				reference: r.reference!,
				beneficiaryName: r.beneficiaryName,
				dateDeposited: r.dateDeposited,
				amountDeposited: r.amount,
				currency: r.currency,
				depositorName: r.depositorName,
				bankName: r.bankName,
				transactionNumber: r.transactionNumber,
				terminalNumber: r.terminalNumber,
			}))
		);
	}

	const showUploadedSection = receipts.length > 0 || pendingUploads > 0;
	const disabled = isSubmitting || uploading;

	return (
		<Stack gap='lg'>
			<Card withBorder padding='lg' radius='md'>
				<Stack gap='md'>
					<Group justify='space-between' align='center'>
						<Group gap='sm'>
							<ThemeIcon variant='light' color='gray' size='lg' radius='md'>
								<IconLibrary size={20} stroke={1.5} />
							</ThemeIcon>
							<Box>
								<Text fw={600} size='sm'>
									Banking Details
								</Text>
								<Text size='xs' c='dimmed'>
									Make payment to the account below
								</Text>
							</Box>
						</Group>
					</Group>

					<Divider variant='dashed' />

					<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='xl'>
						<FieldView label='Bank Name' underline={false}>
							Standard Lesotho Bank
						</FieldView>
						<FieldView label='Account Holder' underline={false}>
							Limkokwing University of Creative Technology
						</FieldView>
						<FieldView label='Account Number' underline={false}>
							<Group gap={6} align='center'>
								<Text size='sm' fw={600} ff='monospace'>
									9080003987813
								</Text>
							</Group>
						</FieldView>
						<FieldView label='Branch Code' underline={false}>
							060667
						</FieldView>
					</SimpleGrid>

					<Paper
						p='md'
						radius='md'
						bg='var(--mantine-color-dark-7)'
						style={{ border: '1px dashed var(--mantine-color-dark-outline)' }}
					>
						<Stack gap={4}>
							<Text size='xs' c='dimmed' fw={700} tt='uppercase' lts={1}>
								Payment Reference
							</Text>
							<Text size='lg' fw={700}>
								{application?.applicant?.fullName}
							</Text>
							<Text size='xs' opacity={0.8}>
								Use your full name exactly as shown above as the bank reference.
							</Text>
						</Stack>
					</Paper>
				</Stack>
			</Card>

			{isMobile ? (
				<MobileReceiptUpload
					key={`mobile-${uploadKey}`}
					onUploadComplete={handleUploadComplete}
					disabled={disabled}
					title='Bank Deposit'
					description='Bank deposit slip showing payment to Limkokwing'
				/>
			) : (
				<ReceiptDropzone
					key={uploadKey}
					onUploadComplete={handleUploadComplete}
					disabled={disabled}
					title='Click to upload bank deposit slips'
					description='Upload your bank deposit slip'
				/>
			)}

			{showUploadedSection && (
				<Stack gap='sm'>
					<Text fw={500} size='sm'>
						Uploaded Receipts
					</Text>
					<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
						{receipts.map((receipt) => (
							<ReceiptCard
								key={receipt.id}
								receipt={receipt}
								onDelete={() => handleDelete(receipt.id)}
							/>
						))}
						{Array.from({ length: pendingUploads }).map((_, i) => (
							<DocumentCardSkeleton key={`skeleton-${i}`} />
						))}
					</SimpleGrid>

					{receipts.length > 0 && (
						<Card withBorder padding='md'>
							<Group justify='space-between'>
								<Text size='sm' fw={500}>
									Total Amount
								</Text>
								<Text
									size='lg'
									fw={700}
									c={isAmountSufficient ? 'green' : 'red'}
								>
									M {totalAmount.toFixed(2)} / M {requiredAmount.toFixed(2)}
								</Text>
							</Group>
							{!isAmountSufficient && receipts.some((r) => r.isValid) && (
								<Text size='xs' c='red' mt='xs'>
									Total amount is less than the required application fee. Please
									upload additional receipts.
								</Text>
							)}
						</Card>
					)}

					{!allValid && receipts.some((r) => !r.isValid) && (
						<Alert
							color='red'
							icon={<IconAlertCircle size={16} />}
							title='Invalid Receipts'
						>
							Some receipts failed validation. Please remove them and upload
							valid bank deposit slips showing payment to Limkokwing University.
						</Alert>
					)}
				</Stack>
			)}

			<Stack gap='lg'>
				<Button
					color='green'
					size='md'
					leftSection={<IconCheck size={20} />}
					onClick={handleSubmit}
					loading={isSubmitting}
					disabled={!canSubmit}
				>
					Submit
				</Button>

				<Divider label='OR' my={'md'} />

				<Button
					variant='subtle'
					color='gray'
					leftSection={<IconCreditCard size={16} />}
					onClick={onSwitchToMpesa}
					disabled={isSubmitting}
				>
					Pay with M-Pesa
				</Button>
			</Stack>
		</Stack>
	);
}
