import DocumentViewer from '@admissions/documents/_components/DocumentViewer';
import { Paper, Stack, Text } from '@mantine/core';
import { notFound } from 'next/navigation';
import { formatDateTime } from '@/shared/lib/utils/dates';
import { DetailsView } from '@/shared/ui/adease';
import PaymentReviewHeader from '../_components/PaymentReviewHeader';
import PaymentReviewSummary from '../_components/PaymentReviewSummary';
import {
	acquirePaymentReviewLock,
	getBankDepositWithDocument,
} from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function DepositDetailsPage({ params }: Props) {
	const { id } = await params;
	const [deposit] = await Promise.all([
		getBankDepositWithDocument(id),
		acquirePaymentReviewLock(id),
	]);

	if (!deposit) return notFound();

	const applicant = deposit.application?.applicant;
	const title =
		deposit.type === 'sales_receipt'
			? 'Sales Receipt Review'
			: 'Payment Review';
	const transactionOrTerminal = deposit.transactionNumber || '-';

	return (
		<DetailsView>
			<PaymentReviewHeader id={id} title={title} status={deposit.status} />

			<Stack gap='md'>
				<PaymentReviewSummary
					applicantName={applicant?.fullName || 'Unknown'}
					applicantId={applicant?.id || null}
					amount={`${deposit.currency || 'M'} ${deposit.amountDeposited || '0.00'}`}
					reference={deposit.reference}
					submitted={
						deposit.createdAt ? formatDateTime(deposit.createdAt) : '-'
					}
					depositor={deposit.depositorName || '-'}
					transactionOrTerminal={transactionOrTerminal}
				/>

				{deposit.document?.fileUrl ? (
					<DocumentViewer
						src={deposit.document.fileUrl}
						alt={deposit.document.fileName || 'Payment proof'}
					/>
				) : (
					<Paper
						withBorder
						radius='md'
						p='xl'
						style={{
							minHeight: 500,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Text c='dimmed' fs='italic'>
							No payment proof image available
						</Text>
					</Paper>
				)}
			</Stack>
		</DetailsView>
	);
}
