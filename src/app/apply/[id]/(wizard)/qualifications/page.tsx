import QualificationsUploadForm from './_components/QualificationsUploadForm';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function QualificationsPage({ params }: Props) {
	const { id } = await params;
	return <QualificationsUploadForm applicationId={id} />;
}
