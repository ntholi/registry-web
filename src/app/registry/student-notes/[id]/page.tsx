import { notFound } from 'next/navigation';
import { DetailsView, DetailsViewHeader } from '@/shared/ui/adease';
import NoteDetailView from '../_components/NoteDetailView';
import { deleteStudentNote, getStudentNote } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function NoteDetailPage({ params }: Props) {
	const { id } = await params;
	const note = await getStudentNote(id);

	if (!note) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title={`Note - ${note.stdNo}`}
				queryKey={['student-notes']}
				handleDelete={async () => {
					'use server';
					await deleteStudentNote(id);
				}}
			/>
			<NoteDetailView note={note} />
		</DetailsView>
	);
}
