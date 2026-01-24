'use client';

import { useApplicant } from '@apply/_lib/useApplicant';
import { Skeleton, Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import PaymentForm from './_components/PaymentForm';
import {
	getApplicantPendingPayment,
	getPaymentPageData,
} from './_server/actions';

export default function PaymentPage() {
	const { applicant: hookApplicant, isLoading: appLoading } = useApplicant();
	const applicantId = hookApplicant?.id ?? '';

	const { data, isLoading: dataLoading } = useQuery({
		queryKey: ['payment-page-data', applicantId],
		queryFn: () => getPaymentPageData(applicantId),
		enabled: !!applicantId,
	});

	const { data: pendingPayment, isLoading: pendingLoading } = useQuery({
		queryKey: ['pending-payment', applicantId],
		queryFn: () => getApplicantPendingPayment(applicantId),
		enabled: !!applicantId,
	});

	const isLoading = appLoading || dataLoading || pendingLoading;

	if (isLoading || !hookApplicant) {
		return (
			<Stack gap='lg'>
				<Skeleton h={200} />
			</Stack>
		);
	}

	return (
		<PaymentForm
			fee={data?.fee ?? null}
			isPaid={data?.isPaid || false}
			pendingTransaction={pendingPayment}
		/>
	);
}
