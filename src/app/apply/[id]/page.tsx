import { redirect } from 'next/navigation';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ApplyIdPage({ params }: Props) {
	const { id } = await params;
	redirect(`/apply/${id}/documents`);
}
