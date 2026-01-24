'use client';

import { Badge, Stack, Text } from '@mantine/core';
import { IconCheck, IconReceipt, IconX } from '@tabler/icons-react';
import {
	DocumentCardShell,
	DocumentDetailRow,
} from '@/shared/ui/DocumentCardShell';

export type UploadedReceipt = {
	id: string;
	receiptNumber: string | null;
	amount: number | null;
	dateIssued: string | null;
	isValid: boolean;
	errors: string[];
	base64: string;
	mediaType: string;
};

type Props = {
	receipt: UploadedReceipt;
	onDelete: () => Promise<void>;
	deleting?: boolean;
};

export function ReceiptCard({ receipt, onDelete, deleting }: Props) {
	return (
		<DocumentCardShell
			icon={<IconReceipt size={20} />}
			iconColor={receipt.isValid ? 'green' : 'red'}
			title='Payment Receipt'
			badge={
				<Badge
					size='xs'
					color={receipt.isValid ? 'green' : 'red'}
					variant='light'
					leftSection={
						receipt.isValid ? <IconCheck size={10} /> : <IconX size={10} />
					}
				>
					{receipt.isValid ? 'Valid' : 'Invalid'}
				</Badge>
			}
			onDelete={onDelete}
			deleting={deleting}
			deleteMessage='Are you sure you want to delete this receipt? This action cannot be undone.'
		>
			<Stack gap={4}>
				<DocumentDetailRow label='Receipt #' value={receipt.receiptNumber} />
				<DocumentDetailRow
					label='Amount'
					value={
						receipt.amount !== null ? `M ${receipt.amount.toFixed(2)}` : null
					}
				/>
				<DocumentDetailRow label='Date' value={receipt.dateIssued} />
				{!receipt.isValid && receipt.errors.length > 0 && (
					<Text size='xs' c='red' mt='xs'>
						{receipt.errors[0]}
					</Text>
				)}
			</Stack>
		</DocumentCardShell>
	);
}
