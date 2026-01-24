import PersonalInfoForm from './_components/PersonalInfoForm';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function PersonalInfoPage({ params }: Props) {
	const { id } = await params;
	return <PersonalInfoForm applicationId={id} />;
}
