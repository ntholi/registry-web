import ProgramSelectionForm from './_components/ProgramSelectionForm';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ProgramPage({ params }: Props) {
	const { id } = await params;

	return <ProgramSelectionForm applicantId={id} />;
}
