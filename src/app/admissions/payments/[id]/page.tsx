import DocumentViewer from '@admissions/documents/_components/DocumentViewer';
import { Grid, GridCol, Paper, Stack, Text } from '@mantine/core';
import { notFound } from 'next/navigation';
import { formatDateTime } from '@/shared/lib/utils/dates';
import { DetailsView } from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';
import PaymentReviewHeader from '../_components/PaymentReviewHeader';
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

	return (
		<DetailsView>
			<PaymentReviewHeader id={id} title={title} status={deposit.status} />

			<Stack gap='md'>
				<Paper withBorder radius='md' p='md'>
					<Grid gutter='md'>
						<GridCol span={{ base: 12, md: 4 }}>
							<Text size='xs' c='dimmed'>
								Applicant
							</Text>
							{applicant ? (
								<Link href={`/admissions/applicants/${applicant.id}`}>
									<Text size='sm' fw={500}>
										{applicant.fullName}
									</Text>
								</Link>
							) : (
								<Text size='sm'>Unknown</Text>
							)}
						</GridCol>
						<GridCol span={{ base: 12, md: 4 }}>
							<Text size='xs' c='dimmed'>
								Amount
							</Text>
							<Text size='sm' fw={500}>
								{deposit.currency || 'M'} {deposit.amountDeposited || '0.00'}
							</Text>
						</GridCol>
						<GridCol span={{ base: 12, md: 4 }}>
							<Text size='xs' c='dimmed'>
								Reference
							</Text>
							<Text size='sm' fw={500} ff='monospace'>
								{deposit.reference}
							</Text>
						</GridCol>
						<GridCol span={{ base: 12, md: 4 }}>
							<Text size='xs' c='dimmed'>
								Submitted
							</Text>
							<Text size='sm'>
								{deposit.createdAt ? formatDateTime(deposit.createdAt) : '-'}
							</Text>
						</GridCol>
						<GridCol span={{ base: 12, md: 4 }}>
							<Text size='xs' c='dimmed'>
								Depositor
							</Text>
							<Text size='sm'>{deposit.depositorName || '-'}</Text>
						</GridCol>
						<GridCol span={{ base: 12, md: 4 }}>
							<Text size='xs' c='dimmed'>
								Type
							</Text>
							<Text size='sm'>
								{deposit.type === 'sales_receipt'
									? 'Sales receipt'
									: 'Bank deposit'}
							</Text>
						</GridCol>
					</Grid>
				</Paper>

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
