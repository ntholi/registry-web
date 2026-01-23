import { notFound } from 'next/navigation';
import PaymentForm from './_components/PaymentForm';
import {
	getApplicantPendingPayment,
	getPaymentPageData,
} from './_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function PaymentPage({ params }: Props) {
	const { id } = await params;
	const [data, pendingPayment] = await Promise.all([
		getPaymentPageData(id),
		getApplicantPendingPayment(id),
	]);

	if (!data.applicant) {
		return notFound();
	}

	return (
		<PaymentForm
			applicantId={id}
			applicant={data.applicant}
			fee={data.fee}
			isPaid={data.isPaid || false}
			pendingTransaction={pendingPayment}
		/>
	);
}
