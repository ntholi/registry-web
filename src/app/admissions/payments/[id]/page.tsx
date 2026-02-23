import { notFound } from 'next/navigation';
import { DetailsView } from '@/shared/ui/adease';
import PaymentReviewDocumentSwitcher from '../_components/PaymentReviewDocumentSwitcher';
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
	const title = deposit.deposits.some((item) => item.type === 'sales_receipt')
		? 'Sales Receipt Review'
		: 'Payment Review';
	const statuses = new Set(deposit.deposits.map((item) => item.status));
	const baseStatus =
		statuses.size === 1 ? deposit.deposits[0]?.status : 'pending';

	return (
		<DetailsView>
			<PaymentReviewHeader
				id={id}
				title={title}
				status={baseStatus || 'pending'}
			/>

			<PaymentReviewDocumentSwitcher
				anchorId={id}
				deposits={deposit.deposits}
				applicantName={applicant?.fullName || 'Unknown'}
				applicantId={applicant?.id || null}
			/>
		</DetailsView>
	);
}
