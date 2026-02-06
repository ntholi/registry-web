import PaymentClient from './_components/PaymentClient';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function PaymentPage({ params }: Props) {
	const { id } = await params;
	return <PaymentClient applicationId={id} />;
}
