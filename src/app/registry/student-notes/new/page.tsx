'use client';

import {
	ActionIcon,
	Avatar,
	Box,
	Button,
	Divider,
	FileButton,
	Group,
	Paper,
	SegmentedControl,
	SimpleGrid,
	Stack,
	Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { getStudent, getStudentPhoto } from '@registry/students';
import {
	IconFile,
	IconPaperclip,
	IconSend,
	IconUser,
	IconX,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import RichTextField from '@/shared/ui/adease/RichTextField';
import StudentInput from '@/shared/ui/StudentInput';
import { VISIBILITY_HINT, VISIBILITY_OPTIONS } from '../_lib/constants';
import type { NoteVisibility } from '../_schema/studentNotes';
import { createStudentNote, uploadNoteAttachment } from '../_server/actions';

export default function NewNotePage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [selectedStdNo, setSelectedStdNo] = useState<number | null>(null);
	const [content, setContent] = useState('');
	const [visibility, setVisibility] = useState<NoteVisibility>('role');
	const [pendingFiles, setPendingFiles] = useState<File[]>([]);

	const { data: selectedStudent } = useQuery({
		queryKey: ['student', selectedStdNo],
		queryFn: () => getStudent(selectedStdNo!),
		enabled: !!selectedStdNo,
	});

	const { data: photoUrl } = useQuery({
		queryKey: ['student-photo', selectedStdNo],
		queryFn: () => getStudentPhoto(selectedStdNo),
		enabled: !!selectedStdNo,
	});

	function handleStdNoChange(value: number | string) {
		const stdNo = Number(value);
		setSelectedStdNo(stdNo > 0 ? stdNo : null);
	}

	function addPendingFile(file: File | null) {
		if (file) setPendingFiles((prev) => [...prev, file]);
	}

	function removePendingFile(index: number) {
		setPendingFiles((prev) => prev.filter((_, i) => i !== index));
	}

	const saveMutation = useMutation({
		mutationFn: async () => {
			if (!selectedStdNo) throw new Error('Please select a student');
			const created = await createStudentNote(
				selectedStdNo,
				content,
				visibility
			);
			if (pendingFiles.length > 0) {
				for (const file of pendingFiles) {
					const formData = new FormData();
					formData.append('file', file);
					await uploadNoteAttachment(selectedStdNo, created.id, formData);
				}
			}
			return created;
		},
		onSuccess: async (created) => {
			await queryClient.invalidateQueries({ queryKey: ['student-notes'] });
			notifications.show({
				title: 'Success',
				message: 'Note created',
				color: 'green',
			});
			router.push(`/registry/student-notes/${created.id}`);
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	const isEmpty = !content.trim() || content === '<p></p>';

	return (
		<Box p='lg'>
			<Stack gap='md'>
				<Text fw={600} size='lg'>
					Create Note
				</Text>

				<StudentInput
					value={selectedStdNo ?? ''}
					onChange={handleStdNoChange}
					required
				/>

				{selectedStudent && (
					<Paper withBorder p='sm' radius='md' bg='transparent'>
						<Group gap='sm'>
							<Avatar
								size={46}
								radius='xl'
								src={photoUrl ?? undefined}
								color='blue'
							>
								<IconUser size={22} />
							</Avatar>
							<Box>
								<Text fw={600} size='sm'>
									{selectedStudent.name}
								</Text>
								<Text size='xs' c='dimmed'>
									{selectedStudent.stdNo}
								</Text>
							</Box>
						</Group>
					</Paper>
				)}

				{selectedStdNo && (
					<>
						<RichTextField
							toolbar='normal'
							placeholder='Write a note...'
							value={content}
							onChange={setContent}
							height={280}
							showFullScreenButton={false}
						/>

						<Stack gap={4}>
							<Text size='sm' fw={500}>
								Visibility
							</Text>
							<SegmentedControl
								size='xs'
								data={VISIBILITY_OPTIONS}
								value={visibility}
								onChange={(val) => setVisibility(val as NoteVisibility)}
							/>
							<Text size='xs' c='dimmed'>
								{VISIBILITY_HINT[visibility]}
							</Text>
						</Stack>

						<Stack gap='xs'>
							<Divider
								label={
									<Text size='xs' c='dimmed'>
										Attachments
									</Text>
								}
								labelPosition='left'
							/>
							<Group gap='xs' align='center'>
								<FileButton
									onChange={addPendingFile}
									accept='application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
								>
									{(props) => (
										<Button
											{...props}
											variant='default'
											size='xs'
											leftSection={<IconPaperclip size={12} />}
										>
											Add Attachment
										</Button>
									)}
								</FileButton>
								{pendingFiles.length === 0 && (
									<Text size='xs' c='dimmed'>
										No attachments yet
									</Text>
								)}
							</Group>

							{pendingFiles.length > 0 && (
								<SimpleGrid cols={{ base: 1, sm: 2 }}>
									{pendingFiles.map((file, i) => (
										<Paper key={`${file.name}-${i}`} p='md' withBorder>
											<Group justify='space-between'>
												<Group gap='xs'>
													<IconFile
														size={14}
														style={{ color: 'var(--mantine-color-dimmed)' }}
													/>
													<Text size='xs'>{file.name}</Text>
												</Group>
												<ActionIcon
													size='xs'
													variant='subtle'
													color='red'
													onClick={() => removePendingFile(i)}
												>
													<IconX size={12} />
												</ActionIcon>
											</Group>
										</Paper>
									))}
								</SimpleGrid>
							)}
						</Stack>

						<Group justify='flex-end' gap='xs'>
							<Button
								leftSection={<IconSend size={16} />}
								onClick={() => saveMutation.mutate()}
								loading={saveMutation.isPending}
								disabled={isEmpty || !selectedStdNo}
							>
								Create Note
							</Button>
						</Group>
					</>
				)}
			</Stack>
		</Box>
	);
}
