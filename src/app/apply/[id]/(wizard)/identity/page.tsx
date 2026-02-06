import IdentityUploadForm from './_components/IdentityUploadForm';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function DocumentsPage({ params }: Props) {
	const { id } = await params;
	return <IdentityUploadForm applicationId={id} />;
}
