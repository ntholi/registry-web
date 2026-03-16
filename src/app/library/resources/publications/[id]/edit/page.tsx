import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { unwrap } from '@/shared/lib/actions/actionResult';
import PublicationForm from '../../_components/Form';
import { getPublication, updatePublication } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditPublicationPage({ params }: Props) {
	const { id } = await params;
	const publication = await getPublication(id);

	if (!publication) return notFound();

	return (
		<Box p={'pg'}>
			<PublicationForm
				onSubmit={async (data) => {
					'use server';
					return unwrap(await updatePublication(publication.id, data));
				}}
				defaultValues={publication}
				title='Edit Publication'
			/>
		</Box>
	);
}
