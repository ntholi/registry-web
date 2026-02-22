'use client';

import {
	Button,
	Divider,
	Group,
	Modal,
	Paper,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { IconCheck, IconReceipt, IconX } from '@tabler/icons-react';
import type { ReceiptResult } from '@/core/integrations/ai/documents';

type Props = {
	opened: boolean;
	onClose: () => void;
	onConfirm: () => void;
	analysis: ReceiptResult | null;
	loading?: boolean;
};

function ReceiptField({
	label,
	value,
}: {
	label: string;
	value?: string | number | null;
}) {
	return (
		<Group gap={4} wrap='nowrap'>
			<Text size='xs' c='dimmed' fw={600} w={80} tt='uppercase'>
				{label}
			</Text>
			<Text size='sm' fw={500} style={{ flex: 1 }}>
				{value?.toString() || '—'}
			</Text>
		</Group>
	);
}

export function ReceiptConfirmationModal({
	opened,
	onClose,
	onConfirm,
	analysis,
	loading,
}: Props) {
	if (!analysis) return null;

	const isSalesReceipt = analysis.receiptType === 'sales_receipt';
	const title = isSalesReceipt
		? 'Confirm Sales Receipt'
		: 'Confirm Bank Deposit';

	return (
		<Modal opened={opened} onClose={onClose} title={title} centered size='md'>
			<Stack gap='lg'>
				<Paper
					p='md'
					radius='md'
					style={{
						background:
							'linear-gradient(135deg, var(--mantine-color-dark-7) 0%, var(--mantine-color-dark-8) 100%)',
						border: '1px solid var(--mantine-color-dark-4)',
						position: 'relative',
						overflow: 'hidden',
					}}
				>
					<Stack gap='md' pt='xs'>
						<Group justify='space-between' align='flex-start'>
							<Stack gap={4}>
								<Text size='xs' c='dimmed' tt='uppercase' fw={600}>
									{isSalesReceipt ? 'Amount Paid' : 'Amount Deposited'}
								</Text>
								<Text size='xl' fw={700} ff='monospace' c='green'>
									{analysis.currency ?? 'M'}{' '}
									{analysis.amountDeposited?.toFixed(2) ?? '—'}
								</Text>
							</Stack>
							<ThemeIcon
								variant='light'
								size={50}
								radius='md'
								color='teal'
								style={{ opacity: 0.8 }}
							>
								<IconReceipt size={28} />
							</ThemeIcon>
						</Group>

						<Divider color='dark.5' />

						<Text size='lg' fw={700} tt='uppercase' lts={1}>
							{analysis.beneficiaryName ?? '—'}
						</Text>

						<Stack gap='xs'>
							{isSalesReceipt && analysis.receiptNumber && (
								<ReceiptField
									label='Receipt #'
									value={analysis.receiptNumber}
								/>
							)}
							{!isSalesReceipt && (
								<ReceiptField label='Reference' value={analysis.reference} />
							)}
							<ReceiptField label='Date' value={analysis.dateDeposited} />
							{!isSalesReceipt && (
								<ReceiptField label='Bank' value={analysis.bankName} />
							)}
							{isSalesReceipt && analysis.paymentMode && (
								<ReceiptField label='Payment' value={analysis.paymentMode} />
							)}
							{analysis.depositorName && (
								<ReceiptField
									label={isSalesReceipt ? 'Paid By' : 'Depositor'}
									value={analysis.depositorName}
								/>
							)}
							{!isSalesReceipt && analysis.transactionNumber && (
								<ReceiptField
									label='Trans No.'
									value={analysis.transactionNumber}
								/>
							)}
						</Stack>
					</Stack>
				</Paper>

				<Group justify='space-between' gap='sm'>
					<Button
						variant='light'
						color='red'
						leftSection={<IconX size={16} />}
						onClick={onClose}
						disabled={loading}
					>
						Try Again
					</Button>
					<Button
						leftSection={<IconCheck size={16} />}
						onClick={onConfirm}
						loading={loading}
					>
						Confirm
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
