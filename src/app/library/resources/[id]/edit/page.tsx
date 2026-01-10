import { notFound } from 'next/navigation';
import ResourceForm from '../../_components/Form';
import { getResource } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditResourcePage({ params }: Props) {
	const { id } = await params;
	const resource = await getResource(Number(id));

	if (!resource) return notFound();

	return <ResourceForm defaultValues={resource} title='Edit Resource' />;
}
