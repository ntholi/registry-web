import { resolveApplicationFee } from '@admissions/_lib/fees';
import {
	Badge,
	Divider,
	Grid,
	GridCol,
	Group,
	Image,
	Stack,
	Text,
} from '@mantine/core';
import { notFound } from 'next/navigation';
import { getDepositStatusColor } from '@/shared/lib/utils/colors';
import { formatDateTime } from '@/shared/lib/utils/dates';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';
import RejectDepositModal from '../_components/RejectDepositModal';
import VerifyDepositModal from '../_components/VerifyDepositModal';
import {
	deleteBankDeposit,
	getBankDepositWithDocument,
} from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function DepositDetailsPage({ params }: Props) {
	const { id } = await params;
	const deposit = await getBankDepositWithDocument(id);

	if (!deposit) return notFound();

	const isPending = deposit.status === 'pending';
	const isVerified = deposit.status === 'verified';
	const applicantName = deposit.application?.applicant?.fullName || 'Unknown';
	const isSalesReceipt = deposit.type === 'sales_receipt';
	const pageTitle = isSalesReceipt
		? 'Sales Receipt Details'
		: 'Bank Deposit Details';

	return (
		<DetailsView>
			<DetailsViewHeader
				title={pageTitle}
				queryKey={['bank-deposits']}
				handleDelete={async () => {
					'use server';
					await deleteBankDeposit(id);
				}}
				hideEdit
			/>

			<DetailsViewBody>
				<Stack gap='md'>
					<Group justify='space-between' align='flex-start'>
						<Stack gap='xs' flex={1}>
							<Text size='lg' fw={600}>
								{isSalesReceipt ? 'Receipt Information' : 'Deposit Information'}
							</Text>
							<Divider />
						</Stack>

						<Stack align='flex-end' gap='md'>
							<Badge
								variant='light'
								color={getDepositStatusColor(deposit.status)}
							>
								{deposit.status}
							</Badge>
							{isPending && (
								<Group gap='xs'>
									<VerifyDepositModal
										depositId={deposit.id}
										applicantName={applicantName}
									/>
									<RejectDepositModal
										depositId={deposit.id}
										applicantName={applicantName}
									/>
								</Group>
							)}
						</Stack>
					</Group>

					<Grid>
						<GridCol span={4}>
							<FieldView label='Amount' underline={false}>
								<Text fw={500}>
									{deposit.currency || 'M'} {deposit.amountDeposited || '0.00'}
								</Text>
							</FieldView>
						</GridCol>
						<GridCol span={4}>
							<FieldView
								label={isSalesReceipt ? 'Receipt #' : 'Reference'}
								underline={false}
							>
								<Text ff='monospace'>
									{isSalesReceipt
										? (deposit.receiptNumber ?? deposit.reference)
										: deposit.reference}
								</Text>
							</FieldView>
						</GridCol>
						<GridCol span={4}>
							<FieldView
								label={isSalesReceipt ? 'Payment Mode' : 'Bank'}
								underline={false}
							>
								{isSalesReceipt
									? deposit.paymentMode || '-'
									: deposit.bankName || '-'}
							</FieldView>
						</GridCol>
					</Grid>

					<Grid>
						<GridCol span={4}>
							<FieldView
								label={isSalesReceipt ? 'Receipt Date' : 'Date Deposited'}
								underline={false}
							>
								{deposit.dateDeposited || '-'}
							</FieldView>
						</GridCol>
						<GridCol span={4}>
							<FieldView
								label={isSalesReceipt ? 'Paid By' : 'Depositor Name'}
								underline={false}
							>
								{deposit.depositorName || '-'}
							</FieldView>
						</GridCol>
						<GridCol span={4}>
							<FieldView
								label={isSalesReceipt ? 'Issuer' : 'Beneficiary'}
								underline={false}
							>
								{deposit.beneficiaryName || '-'}
							</FieldView>
						</GridCol>
					</Grid>

					{!isSalesReceipt && deposit.transactionNumber && (
						<Grid>
							<GridCol span={6}>
								<FieldView label='Transaction Number' underline={false}>
									<Text ff='monospace'>{deposit.transactionNumber}</Text>
								</FieldView>
							</GridCol>
						</Grid>
					)}

					<Divider />

					{deposit.application?.applicant && (
						<Stack gap='xs'>
							<Text size='lg' fw={600}>
								Applicant
							</Text>
							<Grid>
								<GridCol span={6}>
									<FieldView label='Name' underline={false}>
										<Link
											href={`/admissions/applicants/${deposit.application.applicant.id}`}
										>
											{deposit.application.applicant.fullName}
										</Link>
									</FieldView>
								</GridCol>
								<GridCol span={6}>
									<FieldView label='National ID' underline={false}>
										{deposit.application.applicant.nationalId || '-'}
									</FieldView>
								</GridCol>
							</Grid>
							<Grid>
								<GridCol span={6}>
									<FieldView label='Application Fee' underline={false}>
										M{' '}
										{deposit.application.intakePeriod
											? resolveApplicationFee(
													deposit.application.intakePeriod,
													deposit.application.applicant?.nationality ?? null
												)
											: '0.00'}
									</FieldView>
								</GridCol>
								<GridCol span={6}>
									<FieldView label='Intake' underline={false}>
										{deposit.application.intakePeriod?.name || '-'}
									</FieldView>
								</GridCol>
							</Grid>
						</Stack>
					)}

					<Divider />

					{isVerified && deposit.receipt && (
						<>
							<Stack gap='xs'>
								<Text size='lg' fw={600}>
									Receipt Information
								</Text>
								<Grid>
									<GridCol span={6}>
										<FieldView label='Receipt Number' underline={false}>
											<Text fw={500} c='green'>
												{deposit.receipt.receiptNo}
											</Text>
										</FieldView>
									</GridCol>
									<GridCol span={6}>
										<FieldView label='Created By' underline={false}>
											{deposit.receipt.createdByUser?.name || '-'}
										</FieldView>
									</GridCol>
									<GridCol span={6}>
										<FieldView label='Created At' underline={false}>
											{deposit.receipt.createdAt
												? formatDateTime(deposit.receipt.createdAt)
												: '-'}
										</FieldView>
									</GridCol>
								</Grid>
							</Stack>
							<Divider />
						</>
					)}

					<Stack gap='xs'>
						<Text size='lg' fw={600}>
							{isSalesReceipt ? 'Receipt Image' : 'Deposit Slip'}
						</Text>
						{deposit.document?.fileUrl ? (
							<Image
								src={deposit.document.fileUrl}
								alt={isSalesReceipt ? 'Sales Receipt' : 'Deposit Slip'}
								radius='md'
								maw={600}
								fit='contain'
							/>
						) : (
							<Text c='dimmed'>No receipt image available</Text>
						)}
					</Stack>

					<Divider />

					<Stack gap='xs'>
						<Text size='lg' fw={600}>
							Timestamps
						</Text>
						<Grid>
							<GridCol span={6}>
								<FieldView label='Submitted' underline={false}>
									{deposit.createdAt ? formatDateTime(deposit.createdAt) : '-'}
								</FieldView>
							</GridCol>
						</Grid>
					</Stack>
				</Stack>
			</DetailsViewBody>
		</DetailsView>
	);
}
