'use client';

import { useApplicant } from '@apply/_lib/useApplicant';
import { Center, Loader, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getPaymentPageData } from '../_server/actions';
import PaymentForm from './PaymentForm';

type Props = {
	applicationId: string;
};

export default function PaymentClient({ applicationId }: Props) {
	const { applicant } = useApplicant();

	const { data, isLoading, error } = useQuery({
		queryKey: ['payment-data', applicationId],
		queryFn: () => getPaymentPageData(applicationId),
		enabled: !!applicationId && !!applicant,
	});

	if (isLoading) {
		return (
			<Center py='xl'>
				<Loader />
			</Center>
		);
	}

	if (error || !data) {
		return (
			<Center py='xl'>
				<Stack align='center'>
					<Text c='red'>Failed to load payment information</Text>
					<Text size='sm' c='dimmed'>
						Please try refreshing the page
					</Text>
				</Stack>
			</Center>
		);
	}

	return (
		<PaymentForm
			applicationId={applicationId}
			fee={data.fee}
			isPaid={data.isPaid ?? false}
			pendingTransaction={data.pendingTransaction}
		/>
	);
}
