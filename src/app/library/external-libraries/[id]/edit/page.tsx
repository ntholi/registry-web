import { notFound } from 'next/navigation';
import ExternalLibraryForm from '../../_components/Form';
import type { ExternalLibraryInsert } from '../../_lib/types';
import {
	getExternalLibrary,
	updateExternalLibrary,
} from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditExternalLibraryPage({ params }: Props) {
	const { id } = await params;
	const library = await getExternalLibrary(id);

	if (!library) return notFound();

	return (
		<ExternalLibraryForm
			title='Edit External Library'
			defaultValues={library}
			onSubmit={async (values: ExternalLibraryInsert) => {
				'use server';
				const updated = await updateExternalLibrary(id, values);
				if (!updated) throw new Error('Failed to update');
				return updated;
			}}
		/>
	);
}
