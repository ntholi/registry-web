'use client';

import { Center, Loader, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getStudentNotes } from '@/app/registry/student-notes/_server/actions';
import AddNoteForm from './AddNoteForm';
import NoteCard from './NoteCard';

type Props = {
	stdNo: number;
	isActive: boolean;
};

export default function NotesView({ stdNo, isActive }: Props) {
	const { data: session } = useSession();
	const { data: notes, isLoading } = useQuery({
		queryKey: ['student-notes', stdNo],
		queryFn: () => getStudentNotes(stdNo),
		enabled: isActive,
	});

	const userId = session?.user?.id ?? '';
	const userRole = session?.user?.role ?? '';

	if (isLoading) {
		return (
			<Center py='xl'>
				<Loader />
			</Center>
		);
	}

	return (
		<Stack gap='md'>
			<AddNoteForm stdNo={stdNo} />
			{!notes || notes.length === 0 ? (
				<Text c='dimmed' ta='center' py='xl'>
					No notes yet
				</Text>
			) : (
				<Stack gap='sm'>
					{notes.map((note) => (
						<NoteCard
							key={note.id}
							note={note}
							stdNo={stdNo}
							currentUserId={userId}
							currentUserRole={userRole}
						/>
					))}
				</Stack>
			)}
		</Stack>
	);
}
