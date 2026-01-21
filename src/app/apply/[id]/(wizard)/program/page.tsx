import CourseSelectionForm from './_components/CourseSelectionForm';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ProgramPage({ params }: Props) {
	const { id } = await params;

	return <CourseSelectionForm applicantId={id} />;
}
