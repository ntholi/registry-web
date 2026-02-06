'use client';

import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { IconReceipt, IconUpload } from '@tabler/icons-react';
import {
	getDepositStatusColor,
	getPaymentStatusColor,
	type PaymentStatusType,
} from '@/shared/lib/utils/colors';
import type { PaymentStatus } from '../_lib/types';

type Receipt = {
	id: string;
	receiptNo: string;
	createdAt: Date | null;
};

type BankDeposit = {
	id: string;
	amountDeposited: string | null;
	dateDeposited: string | null;
	status: 'pending' | 'verified' | 'rejected';
	createdAt: Date | null;
	receipt: Receipt | null;
};

type Props = {
	feeAmount: string;
	paymentStatus: PaymentStatus;
	bankDeposits: BankDeposit[];
};

export default function PaymentSection({
	feeAmount,
	paymentStatus,
	bankDeposits,
}: Props) {
	const statusLabels = {
		pending: 'Pending Verification',
		verified: 'Verified',
		rejected: 'Rejected',
	};

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

			{bankDeposits.length > 0 && (
				<Stack gap='xs'>
					<Text size='sm' fw={500}>
						Bank Deposits:
					</Text>
					{bankDeposits.map((deposit) => (
						<Paper key={deposit.id} p='sm' withBorder>
							<Stack gap='xs'>
								<Group justify='space-between'>
									<Group gap='xs'>
										<IconUpload size={16} />
										<Text size='sm' fw={500}>
											{deposit.amountDeposited
												? `M${Number(deposit.amountDeposited).toFixed(2)}`
												: 'Amount N/A'}
										</Text>
										{deposit.dateDeposited && (
											<Text size='xs' c='dimmed'>
												{deposit.dateDeposited}
											</Text>
										)}
									</Group>
									<Badge
										color={getDepositStatusColor(deposit.status)}
										variant='light'
										size='sm'
									>
										{statusLabels[deposit.status]}
									</Badge>
								</Group>
								{deposit.receipt && (
									<Group gap='xs'>
										<IconReceipt size={14} />
										<Text size='xs' c='dimmed'>
											Receipt: {deposit.receipt.receiptNo}
										</Text>
									</Group>
								)}
							</Stack>
						</Paper>
					))}
				</Stack>
			)}

			{bankDeposits.length === 0 && paymentStatus === 'unpaid' && (
				<Text size='sm' c='dimmed'>
					No deposits submitted yet
				</Text>
			)}
		</Stack>
	);
}
