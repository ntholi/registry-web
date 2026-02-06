import ReviewForm from './_components/ReviewForm';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ReviewPage({ params }: Props) {
	const { id } = await params;
	return <ReviewForm applicationId={id} />;
}
