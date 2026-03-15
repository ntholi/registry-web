import { Group, Text } from '@mantine/core';
import { notFound } from 'next/navigation';
import { unwrap } from '@/shared/lib/utils/actionResult';
import { DetailsView, DetailsViewHeader } from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';
import NoteDetailView from '../_components/NoteDetailView';
import { deleteStudentNote, getStudentNote } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function NoteDetailPage({ params }: Props) {
	const { id } = await params;
	const note = unwrap(await getStudentNote(id));

	if (!note) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title={
					<Group gap={'xs'}>
						<Text size='lg'>{note.studentName}</Text>•
						<Link href={`/registry/students/${note.stdNo}/`}>{note.stdNo}</Link>
					</Group>
				}
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
