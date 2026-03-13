'use client';

import {
	Button,
	Card,
	Center,
	Group,
	Loader,
	Paper,
	SimpleGrid,
	Stack,
	Text,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { authClient } from '@/core/auth-client';
import { getStudentNotes } from '../_server/actions';
import NoteCard from './NoteCard';
import NoteModal from './NoteModal';

type Props = {
	stdNo: number;
	isActive: boolean;
};

export default function NotesView({ stdNo, isActive }: Props) {
	const { data: session } = authClient.useSession();
	const [createOpen, setCreateOpen] = useState(false);
	const { data: notes, isLoading } = useQuery({
		queryKey: ['student-notes', stdNo],
		queryFn: () => getStudentNotes(stdNo),
		enabled: isActive,
	});

	const userId = session?.user?.id ?? '';
	const userRole = session?.user?.role ?? '';

	return (
		<Stack gap='md'>
			<Card withBorder p='md'>
				<Group justify='space-between' align='center'>
					<Stack gap={4}>
						<Text size='sm' fw={500}>
							Notes
						</Text>
						<Text size='xs' c='dimmed'>
							Internal staff notes and observations about this student
						</Text>
					</Stack>
					<Button
						leftSection={<IconPlus size={14} />}
						variant='filled'
						size='sm'
						onClick={() => setCreateOpen(true)}
					>
						Create
					</Button>
				</Group>
			</Card>

			{isLoading ? (
				<Center py='xl'>
					<Loader />
				</Center>
			) : !notes || notes.length === 0 ? (
				<Paper p='xl' withBorder>
					<Text c='dimmed' ta='center'>
						No notes yet. Create the first note for this student.
					</Text>
				</Paper>
			) : (
				<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='sm'>
					{notes.map((note) => (
						<NoteCard
							key={note.id}
							note={note}
							stdNo={stdNo}
							currentUserId={userId}
							currentUserRole={userRole}
						/>
					))}
				</SimpleGrid>
			)}

			<NoteModal
				opened={createOpen}
				onClose={() => setCreateOpen(false)}
				stdNo={stdNo}
			/>
		</Stack>
	);
}
