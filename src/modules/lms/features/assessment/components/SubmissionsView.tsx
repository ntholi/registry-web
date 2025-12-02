'use client';

import {
	ActionIcon,
	Avatar,
	Badge,
	Box,
	Grid,
	Group,
	Loader,
	Modal,
	NavLink,
	Paper,
	ScrollArea,
	Stack,
	Text,
	ThemeIcon,
	UnstyledButton,
} from '@mantine/core';
import {
	IconChevronLeft,
	IconChevronRight,
	IconDownload,
	IconFile,
	IconFileCode,
	IconFileText,
	IconFileTypePdf,
	IconPhoto,
	IconUsers,
	IconVideo,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getAssignmentSubmissions } from '../server/actions';
import type { SubmissionFile, SubmissionUser } from '../types';
import FilePreview from './FilePreview';

type Props = {
	assignmentId: number;
	courseId: number;
};

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(filename: string) {
	const extension = filename.split('.').pop()?.toLowerCase() || '';

	if (extension === 'pdf') {
		return <IconFileTypePdf size={20} />;
	}
	if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
		return <IconPhoto size={20} />;
	}
	if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(extension)) {
		return <IconVideo size={20} />;
	}
	if (
		[
			'c',
			'cpp',
			'h',
			'hpp',
			'java',
			'js',
			'jsx',
			'ts',
			'tsx',
			'py',
			'rb',
			'go',
			'rs',
			'php',
			'cs',
			'swift',
			'kt',
			'html',
			'css',
			'json',
			'xml',
			'yaml',
			'sql',
			'sh',
		].includes(extension)
	) {
		return <IconFileCode size={20} />;
	}
	if (['txt', 'log', 'csv', 'md'].includes(extension)) {
		return <IconFileText size={20} />;
	}

	return <IconFile size={20} />;
}

function getSubmissionFiles(user: SubmissionUser): SubmissionFile[] {
	if (!user.submission?.plugins) return [];

	const files: SubmissionFile[] = [];
	for (const plugin of user.submission.plugins) {
		if (plugin.fileareas) {
			for (const area of plugin.fileareas) {
				files.push(...area.files);
			}
		}
	}
	return files;
}

function formatDate(timestamp: number): string {
	return new Date(timestamp * 1000).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

type StudentListProps = {
	users: SubmissionUser[];
	selectedUser: SubmissionUser | null;
	onSelectUser: (user: SubmissionUser) => void;
};

function StudentList({ users, selectedUser, onSelectUser }: StudentListProps) {
	const submittedUsers = users.filter(
		(u) => u.submission && u.submission.status === 'submitted'
	);
	const notSubmittedUsers = users.filter(
		(u) => !u.submission || u.submission.status !== 'submitted'
	);

	return (
		<ScrollArea h='calc(100vh - 350px)' type='auto'>
			<Stack gap={4}>
				<Text size='xs' fw={600} c='dimmed' tt='uppercase' px='sm' pb='xs'>
					Submitted ({submittedUsers.length})
				</Text>
				{submittedUsers.map((user) => {
					const files = getSubmissionFiles(user);
					return (
						<NavLink
							key={user.id}
							active={selectedUser?.id === user.id}
							label={user.fullname}
							description={`${files.length} file${files.length !== 1 ? 's' : ''}`}
							leftSection={
								<Avatar src={user.profileimageurl} size='sm' radius='xl' />
							}
							rightSection={
								<Badge size='xs' variant='light' color='green'>
									{files.length}
								</Badge>
							}
							onClick={() => onSelectUser(user)}
						/>
					);
				})}

				{notSubmittedUsers.length > 0 && (
					<>
						<Text
							size='xs'
							fw={600}
							c='dimmed'
							tt='uppercase'
							px='sm'
							pt='md'
							pb='xs'
						>
							Not Submitted ({notSubmittedUsers.length})
						</Text>
						{notSubmittedUsers.map((user) => (
							<NavLink
								key={user.id}
								active={selectedUser?.id === user.id}
								label={user.fullname}
								description='No submission'
								leftSection={
									<Avatar src={user.profileimageurl} size='sm' radius='xl' />
								}
								rightSection={
									<Badge size='xs' variant='light' color='gray'>
										-
									</Badge>
								}
								onClick={() => onSelectUser(user)}
							/>
						))}
					</>
				)}
			</Stack>
		</ScrollArea>
	);
}

type FileListProps = {
	files: SubmissionFile[];
	selectedFile: SubmissionFile | null;
	onSelectFile: (file: SubmissionFile) => void;
};

function FileList({ files, selectedFile, onSelectFile }: FileListProps) {
	if (files.length === 0) {
		return (
			<Box py='xl' ta='center'>
				<Stack align='center' gap='md'>
					<ThemeIcon size={48} variant='light' color='gray'>
						<IconFile size={24} />
					</ThemeIcon>
					<Text c='dimmed' size='sm'>
						No files submitted
					</Text>
				</Stack>
			</Box>
		);
	}

	return (
		<Stack gap='xs'>
			{files.map((file, index) => (
				<UnstyledButton
					key={`${file.filename}-${index}`}
					onClick={() => onSelectFile(file)}
					style={{
						width: '100%',
					}}
				>
					<Paper
						p='sm'
						withBorder
						style={(theme) => ({
							backgroundColor:
								selectedFile?.filename === file.filename &&
								selectedFile?.timemodified === file.timemodified
									? theme.colors.blue[9]
									: undefined,
							cursor: 'pointer',
						})}
					>
						<Group gap='sm' wrap='nowrap'>
							<ThemeIcon variant='light' color='gray' size='lg'>
								{getFileIcon(file.filename)}
							</ThemeIcon>
							<Box style={{ flex: 1, overflow: 'hidden' }}>
								<Text size='sm' fw={500} truncate>
									{file.filename}
								</Text>
								<Text size='xs' c='dimmed'>
									{formatFileSize(file.filesize)}
								</Text>
							</Box>
							<ActionIcon
								variant='subtle'
								color='gray'
								component='a'
								href={file.fileurl}
								target='_blank'
								rel='noopener noreferrer'
								onClick={(e) => e.stopPropagation()}
							>
								<IconDownload size={16} />
							</ActionIcon>
						</Group>
					</Paper>
				</UnstyledButton>
			))}
		</Stack>
	);
}

type FilePreviewModalProps = {
	file: SubmissionFile | null;
	files: SubmissionFile[];
	onClose: () => void;
	onNavigate: (file: SubmissionFile) => void;
};

function FilePreviewModal({
	file,
	files,
	onClose,
	onNavigate,
}: FilePreviewModalProps) {
	const currentIndex = file ? files.indexOf(file) : -1;
	const hasPrev = currentIndex > 0;
	const hasNext = currentIndex < files.length - 1;

	function handlePrev() {
		if (hasPrev) {
			onNavigate(files[currentIndex - 1]);
		}
	}

	function handleNext() {
		if (hasNext) {
			onNavigate(files[currentIndex + 1]);
		}
	}

	return (
		<Modal
			opened={file !== null}
			onClose={onClose}
			size='xl'
			title={
				<Group gap='sm'>
					<Text fw={600} size='lg' truncate style={{ maxWidth: 400 }}>
						{file?.filename}
					</Text>
					{file && (
						<ActionIcon
							variant='subtle'
							color='gray'
							component='a'
							href={file.fileurl}
							target='_blank'
							rel='noopener noreferrer'
							onClick={(e) => e.stopPropagation()}
						>
							<IconDownload size={18} />
						</ActionIcon>
					)}
				</Group>
			}
			padding='md'
		>
			<Stack gap='md'>
				{file && <FilePreview file={file} />}
				{files.length > 1 && (
					<Group justify='center' gap='xs'>
						<ActionIcon
							variant='subtle'
							onClick={handlePrev}
							disabled={!hasPrev}
						>
							<IconChevronLeft size={20} />
						</ActionIcon>
						<Text size='sm' c='dimmed'>
							{currentIndex + 1} of {files.length}
						</Text>
						<ActionIcon
							variant='subtle'
							onClick={handleNext}
							disabled={!hasNext}
						>
							<IconChevronRight size={20} />
						</ActionIcon>
					</Group>
				)}
			</Stack>
		</Modal>
	);
}

export default function SubmissionsView({ assignmentId, courseId }: Props) {
	const [selectedUser, setSelectedUser] = useState<SubmissionUser | null>(null);
	const [selectedFile, setSelectedFile] = useState<SubmissionFile | null>(null);

	const { data: users, isLoading } = useQuery({
		queryKey: ['assignment-submissions', assignmentId, courseId],
		queryFn: () => getAssignmentSubmissions(assignmentId, courseId),
	});

	if (isLoading) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' py='xl'>
					<Loader size='md' />
					<Text c='dimmed' size='sm'>
						Loading submissions...
					</Text>
				</Stack>
			</Paper>
		);
	}

	if (!users || users.length === 0) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' py='xl'>
					<ThemeIcon size={60} variant='light' color='gray'>
						<IconUsers size={30} />
					</ThemeIcon>
					<Text c='dimmed' size='sm'>
						No students enrolled in this course.
					</Text>
				</Stack>
			</Paper>
		);
	}

	const files = selectedUser ? getSubmissionFiles(selectedUser) : [];

	return (
		<>
			<Grid gutter='md'>
				<Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
					<Paper p='md' withBorder h='100%'>
						<Text fw={600} size='sm' mb='md'>
							Students
						</Text>
						<StudentList
							users={users}
							selectedUser={selectedUser}
							onSelectUser={setSelectedUser}
						/>
					</Paper>
				</Grid.Col>
				<Grid.Col span={{ base: 12, md: 8, lg: 9 }}>
					<Paper p='md' withBorder h='100%'>
						{selectedUser ? (
							<Stack gap='md'>
								<Group justify='space-between'>
									<Group gap='sm'>
										<Avatar
											src={selectedUser.profileimageurl}
											size='md'
											radius='xl'
										/>
										<Box>
											<Text fw={600}>{selectedUser.fullname}</Text>
											{selectedUser.submission && (
												<Text size='xs' c='dimmed'>
													Submitted{' '}
													{formatDate(selectedUser.submission.timemodified)}
												</Text>
											)}
										</Box>
									</Group>
									{selectedUser.submission?.status === 'submitted' && (
										<Badge color='green'>Submitted</Badge>
									)}
								</Group>
								<FileList
									files={files}
									selectedFile={selectedFile}
									onSelectFile={setSelectedFile}
								/>
							</Stack>
						) : (
							<Stack align='center' py='xl'>
								<ThemeIcon size={60} variant='light' color='gray'>
									<IconUsers size={30} />
								</ThemeIcon>
								<Text c='dimmed' size='sm'>
									Select a student to view their submission
								</Text>
							</Stack>
						)}
					</Paper>
				</Grid.Col>
			</Grid>

			<FilePreviewModal
				file={selectedFile}
				files={files}
				onClose={() => setSelectedFile(null)}
				onNavigate={setSelectedFile}
			/>
		</>
	);
}
