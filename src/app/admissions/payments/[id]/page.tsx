import {
	Badge,
	Divider,
	Grid,
	GridCol,
	Group,
	Stack,
	Text,
} from '@mantine/core';
import { notFound } from 'next/navigation';
import { getTransactionStatusColor } from '@/shared/lib/utils/colors';
import { formatDateTime } from '@/shared/lib/utils/dates';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';
import MarkAsPaidModal from '../_components/MarkAsPaidModal';
import type { PaymentWithRelations } from '../_lib/types';
import { deletePayment, getPayment } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function PaymentDetailsPage({ params }: Props) {
	const { id } = await params;
	const payment = (await getPayment(id)) as PaymentWithRelations | null;

	if (!payment) return notFound();

	const isPending = payment.status === 'pending';
	const isSuccess = payment.status === 'success';

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Payment Details'
				queryKey={['payments']}
				handleDelete={async () => {
					'use server';
					await deletePayment(id);
				}}
				hideEdit
			/>

			<DetailsViewBody>
				<Stack gap='md'>
					<Group justify='space-between' align='flex-start'>
						<Stack gap='xs' flex={1}>
							<Text size='lg' fw={600}>
								Transaction Information
							</Text>
							<Divider />
						</Stack>

						<Stack align='flex-end' gap='md'>
							<Badge
								variant='light'
								color={getTransactionStatusColor(payment.status)}
							>
								{payment.status}
							</Badge>
							{isPending && <MarkAsPaidModal payment={payment} />}
						</Stack>
					</Group>

					<Grid>
						<GridCol span={4}>
							<FieldView label='Amount' underline={false}>
								<Text fw={500}>M {payment.amount}</Text>
							</FieldView>
						</GridCol>
						<GridCol span={4}>
							<FieldView label='Mobile Number' underline={false}>
								{payment.mobileNumber}
							</FieldView>
						</GridCol>
						<GridCol span={4}>
							<FieldView label='Provider' underline={false}>
								<Badge size='sm' variant='light'>
									{payment.provider.toUpperCase()}
								</Badge>
							</FieldView>
						</GridCol>
					</Grid>

					<Divider />

					<Stack gap='xs'>
						<Text size='lg' fw={600}>
							Applicant
						</Text>
						<Grid>
							<GridCol span={6}>
								<FieldView label='Name' underline={false}>
									<Link href={`/admissions/applicants/${payment.applicant.id}`}>
										{payment.applicant.fullName}
									</Link>
								</FieldView>
							</GridCol>
						</Grid>
					</Stack>

					<Divider />

					<Stack gap='xs'>
						<Text size='lg' fw={600}>
							Reference Details
						</Text>
						<Grid>
							<GridCol span={6}>
								<FieldView label='Client Reference' underline={false}>
									<Text size='sm' ff='monospace'>
										{payment.clientReference}
									</Text>
								</FieldView>
							</GridCol>
							<GridCol span={6}>
								<FieldView label='Provider Reference' underline={false}>
									{payment.providerReference || '-'}
								</FieldView>
							</GridCol>
							{payment.manualReference && (
								<GridCol span={6}>
									<FieldView label='Manual Reference' underline={false}>
										{payment.manualReference}
									</FieldView>
								</GridCol>
							)}
							{isSuccess && payment.receiptNumber && (
								<GridCol span={6}>
									<FieldView label='Receipt Number' underline={false}>
										<Text fw={500} c='green'>
											{payment.receiptNumber}
										</Text>
									</FieldView>
								</GridCol>
							)}
						</Grid>
					</Stack>

					<Divider />

					<Stack gap='xs'>
						<Text size='lg' fw={600}>
							Timestamps
						</Text>
						<Grid>
							<GridCol span={4}>
								<FieldView label='Created' underline={false}>
									{payment.createdAt ? formatDateTime(payment.createdAt) : '-'}
								</FieldView>
							</GridCol>
							<GridCol span={4}>
								<FieldView label='Updated' underline={false}>
									{payment.updatedAt ? formatDateTime(payment.updatedAt) : '-'}
								</FieldView>
							</GridCol>
							{payment.markedPaidByUser && (
								<GridCol span={4}>
									<FieldView label='Marked Paid By' underline={false}>
										{payment.markedPaidByUser.name || '-'}
									</FieldView>
								</GridCol>
							)}
						</Grid>
					</Stack>
				</Stack>
			</DetailsViewBody>
		</DetailsView>
	);
}
