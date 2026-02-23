'use client';

import DocumentViewer from '@admissions/documents/_components/DocumentViewer';
import { Paper, SegmentedControl, Stack, Text } from '@mantine/core';
import { useMemo, useState } from 'react';
import { formatDateTime } from '@/shared/lib/utils/dates';
import type { GroupedPaymentReviewDeposit } from '../_lib/types';
import PaymentReviewSummary from './PaymentReviewSummary';

type Props = {
	anchorId: string;
	deposits: GroupedPaymentReviewDeposit[];
	applicantName: string;
	applicantId: string | null;
};

export default function PaymentReviewDocumentSwitcher({
	anchorId,
	deposits,
	applicantName,
	applicantId,
}: Props) {
	const [selectedId, setSelectedId] = useState<string>(anchorId);

	const selected = useMemo(() => {
		const active = deposits.find((item) => item.id === selectedId);
		return active ?? deposits[0];
	}, [deposits, selectedId]);

	if (!selected) {
		return (
			<Paper withBorder radius='md' p='xl'>
				<Text c='dimmed' fs='italic'>
					No payment documents found for this application
				</Text>
			</Paper>
		);
	}

	return (
		<Stack gap='md'>
			{deposits.length > 1 ? (
				<SegmentedControl
					color='blue'
					fullWidth
					size='sm'
					value={selected.id}
					onChange={setSelectedId}
					data={deposits.map((item, idx) => ({
						value: item.id,
						label:
							item.transactionNumber ||
							item.terminalNumber ||
							item.reference ||
							`Document ${idx + 1}`,
					}))}
				/>
			) : null}

			<PaymentReviewSummary
				applicantName={applicantName}
				applicantId={applicantId}
				amount={`${selected.currency || 'M'} ${selected.amountDeposited || '0.00'}`}
				reference={selected.reference}
				submitted={
					selected.createdAt ? formatDateTime(selected.createdAt) : '-'
				}
				depositor={selected.depositorName || '-'}
				transactionOrTerminal={
					selected.transactionNumber || selected.terminalNumber || '-'
				}
			/>

			{selected.document?.fileUrl ? (
				<DocumentViewer
					src={selected.document.fileUrl}
					alt={selected.document.fileName || 'Payment proof'}
				/>
			) : (
				<Paper withBorder radius='md' p='xl' mih={500}>
					<Stack h='100%' justify='center' align='center'>
						<Text c='dimmed' fs='italic'>
							No payment proof image available
						</Text>
					</Stack>
				</Paper>
			)}
		</Stack>
	);
}
