'use client';

import {
	Alert,
	Card,
	Group,
	SimpleGrid,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import { useState } from 'react';
import {
	MobileReceiptUpload,
	type ReceiptUploadResult,
} from '@/shared/ui/MobileReceiptUpload';
import { ReceiptUpload as ReceiptDropzone } from '@/shared/ui/ReceiptUpload';
import { validateSingleReceipt } from '../_server/actions';
import { ReceiptCard, type UploadedReceipt } from './ReceiptCard';

type Props = {
	fee: string;
	intakeStartDate: string;
	intakeEndDate: string;
	onValidationComplete: (
		receipts: Array<{
			base64: string;
			mediaType: string;
			receiptNumber: string;
		}>
	) => void;
	onTotalAmountChange: (amount: number) => void;
	disabled?: boolean;
};

function generateId(): string {
	return Math.random().toString(36).slice(2, 11);
}

export default function ReceiptUploadForm({
	fee,
	intakeStartDate,
	intakeEndDate,
	onValidationComplete,
	onTotalAmountChange,
	disabled,
}: Props) {
	const isMobile = useMediaQuery('(max-width: 768px)');
	const [uploading, setUploading] = useState(false);
	const [uploadKey, setUploadKey] = useState(0);
	const [receipts, setReceipts] = useState<UploadedReceipt[]>([]);
	const [deleting, setDeleting] = useState(false);

	const requiredAmount = parseFloat(fee);
	const totalAmount = receipts
		.filter((r) => r.isValid)
		.reduce((sum, r) => sum + (r.amount ?? 0), 0);
	const isAmountSufficient = totalAmount >= requiredAmount;
	const allValid = receipts.every((r) => r.isValid);

	async function handleUploadComplete(result: ReceiptUploadResult) {
		try {
			setUploading(true);

			const validation = await validateSingleReceipt(
				result.base64,
				result.file.type,
				intakeStartDate,
				intakeEndDate
			);

			const newReceipt: UploadedReceipt = {
				id: generateId(),
				receiptNumber: validation.data?.receiptNumber ?? null,
				amount: validation.data?.amountPaid ?? null,
				dateIssued: validation.data?.dateIssued ?? null,
				isValid: validation.isValid,
				errors: validation.errors,
				base64: result.base64,
				mediaType: result.file.type,
			};

			setReceipts((prev) => {
				const updated = [...prev, newReceipt];
				updateCallbacks(updated);
				return updated;
			});

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
		}
	}

	function updateCallbacks(updated: UploadedReceipt[]) {
		const newTotal = updated
			.filter((r) => r.isValid)
			.reduce((sum, r) => sum + (r.amount ?? 0), 0);
		onTotalAmountChange(newTotal);

		const validReceipts = updated.filter((r) => r.isValid && r.receiptNumber);
		onValidationComplete(
			validReceipts.map((r) => ({
				base64: r.base64,
				mediaType: r.mediaType,
				receiptNumber: r.receiptNumber!,
			}))
		);
	}

	function handleDelete(id: string) {
		setDeleting(true);
		setReceipts((prev) => {
			const updated = prev.filter((r) => r.id !== id);
			updateCallbacks(updated);
			return updated;
		});
		setDeleting(false);
		notifications.show({
			title: 'Receipt removed',
			message: 'Receipt has been deleted',
			color: 'green',
		});
	}

	return (
		<Stack gap='lg'>
			<Stack gap='xs'>
				<Title order={5}>Upload Payment Receipts</Title>
				<Text c='dimmed' size='sm'>
					Upload your Limkokwing University payment receipts
				</Text>
			</Stack>

			{isMobile ? (
				<MobileReceiptUpload
					key={`mobile-${uploadKey}`}
					onUploadComplete={handleUploadComplete}
					disabled={disabled || uploading}
					title='Upload Receipt'
					description='Limkokwing University receipt (SR-XXXXX format)'
				/>
			) : (
				<ReceiptDropzone
					key={uploadKey}
					onUploadComplete={handleUploadComplete}
					disabled={disabled || uploading}
					title='Drop receipt here or click to browse'
					description='Limkokwing University receipt (SR-XXXXX format)'
				/>
			)}

			{receipts.length > 0 && (
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
								deleting={deleting}
							/>
						))}
					</SimpleGrid>

					<Card withBorder padding='md'>
						<Group justify='space-between'>
							<Text size='sm' fw={500}>
								Total Amount
							</Text>
							<Text size='lg' fw={700} c={isAmountSufficient ? 'green' : 'red'}>
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

					{!allValid && receipts.some((r) => !r.isValid) && (
						<Alert
							color='red'
							icon={<IconAlertCircle size={16} />}
							title='Invalid Receipts'
						>
							Some receipts failed validation. Please remove them and upload
							valid Limkokwing University receipts.
						</Alert>
					)}
				</Stack>
			)}
		</Stack>
	);
}
