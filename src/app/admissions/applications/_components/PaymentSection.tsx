'use client';

import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { IconReceipt } from '@tabler/icons-react';
import {
	getPaymentStatusColor,
	type PaymentStatusType,
} from '@/shared/lib/utils/colors';
import { formatDateTime } from '@/shared/lib/utils/dates';
import type { PaymentStatus } from '../_lib/types';
import RecordPaymentModal from './RecordPaymentModal';

type Receipt = {
	id: string;
	receiptNo: string;
	createdAt: Date | null;
};

type Props = {
	applicationId: number;
	feeAmount: string;
	paymentStatus: PaymentStatus;
	receipts: { receipt: Receipt }[];
};

export default function PaymentSection({
	applicationId,
	feeAmount,
	paymentStatus,
	receipts,
}: Props) {
	return (
		<Stack gap='md'>
			<Group justify='space-between'>
				<Group gap='xs'>
					<Text size='sm' fw={500}>
						Application Fee:
					</Text>
					<Text size='sm' fw={700}>
						M{Number(feeAmount).toFixed(2)}
					</Text>
				</Group>
				<Badge
					color={getPaymentStatusColor(paymentStatus as PaymentStatusType)}
					variant='light'
					size='lg'
				>
					{paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
				</Badge>
			</Group>

			{paymentStatus === 'unpaid' && (
				<RecordPaymentModal applicationId={applicationId} />
			)}

			{receipts.length > 0 && (
				<Stack gap='xs'>
					<Text size='sm' fw={500}>
						Linked Receipts:
					</Text>
					{receipts.map(({ receipt }) => (
						<Paper key={receipt.id} p='xs' withBorder>
							<Group gap='xs'>
								<IconReceipt size={16} />
								<Text size='sm' fw={500}>
									{receipt.receiptNo}
								</Text>
								<Text size='xs' c='dimmed'>
									{receipt.createdAt ? formatDateTime(receipt.createdAt) : ''}
								</Text>
							</Group>
						</Paper>
					))}
				</Stack>
			)}
		</Stack>
	);
}
