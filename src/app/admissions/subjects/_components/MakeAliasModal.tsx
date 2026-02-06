'use client';

import { Button, Group, Modal, Select, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconArrowRight } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { findActiveSubjects, moveSubjectToAlias } from '../_server/actions';

type Props = {
	subjectId: string;
	subjectName: string;
};

export default function MakeAliasModal({ subjectId, subjectName }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [targetId, setTargetId] = useState<string | null>(null);
	const queryClient = useQueryClient();
	const router = useRouter();

	const { data: subjects = [], isLoading } = useQuery({
		queryKey: ['subjects', 'active'],
		queryFn: () => findActiveSubjects(),
		enabled: opened,
	});

	const subjectOptions = subjects
		.filter((s) => s.id !== subjectId)
		.map((s) => ({ value: s.id, label: s.name }));

	const selectedSubject = subjects.find((s) => s.id === targetId);

	const mutation = useMutation({
		mutationFn: async () => {
			if (!targetId) throw new Error('Please select a subject');
			return moveSubjectToAlias(subjectId, targetId);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['subjects'] });
			notifications.show({
				title: 'Success',
				message: `"${subjectName}" is now an alias of "${selectedSubject?.name}"`,
				color: 'green',
			});
			close();
			setTargetId(null);
			router.push(`/admissions/subjects/${targetId}`);
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	function handleClose() {
		setTargetId(null);
		close();
	}

	return (
		<>
			<Button
				variant='light'
				leftSection={<IconArrowRight size={16} />}
				onClick={open}
			>
				Make Alias
			</Button>

			<Modal opened={opened} onClose={handleClose} title='Make Alias'>
				<Stack>
					<Text size='sm' c='dimmed'>
						This will add "<strong>{subjectName}</strong>" as an alias to the
						selected subject and update all student records to point to the
						target subject. This subject will then be deactivated.
					</Text>

					<Select
						label='Target Subject'
						placeholder='Select subject'
						data={subjectOptions}
						value={targetId}
						onChange={setTargetId}
						searchable
						nothingFoundMessage='No subjects found'
						disabled={isLoading}
						required
					/>

					<Group justify='flex-end'>
						<Button variant='subtle' onClick={handleClose}>
							Cancel
						</Button>
						<Button
							onClick={() => mutation.mutate()}
							loading={mutation.isPending}
							disabled={!targetId}
						>
							Make Alias
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
