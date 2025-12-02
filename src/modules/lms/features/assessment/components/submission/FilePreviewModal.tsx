'use client';

import { ActionIcon, Group, Modal, Stack, Text } from '@mantine/core';
import {
	IconChevronLeft,
	IconChevronRight,
	IconDownload,
} from '@tabler/icons-react';
import type { SubmissionFile } from '../../types';
import FilePreview from '../FilePreview';

type Props = {
	file: SubmissionFile | null;
	files: SubmissionFile[];
	onClose: () => void;
	onNavigate: (file: SubmissionFile) => void;
};

export default function FilePreviewModal({
	file,
	files,
	onClose,
	onNavigate,
}: Props) {
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
