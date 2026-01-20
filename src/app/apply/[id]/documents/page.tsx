import DocumentsUploadForm from './_components/DocumentsUploadForm';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function DocumentsPage({ params }: Props) {
	const { id } = await params;

	return <DocumentsUploadForm applicantId={id} />;
}
