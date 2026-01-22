import { notFound } from 'next/navigation';
import ResourceForm from '../../_components/Form';
import { getResource, updateResource } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditResourcePage({ params }: Props) {
	const { id } = await params;
	const resource = await getResource(id);

	if (!resource) return notFound();

	return (
		<ResourceForm
			onSubmit={(data) => updateResource(resource.id, data)}
			defaultValues={resource}
			title='Edit Resource'
		/>
	);
}
