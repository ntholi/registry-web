'use client';

import {
	ActionIcon,
	Box,
	Group,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	UnstyledButton,
} from '@mantine/core';
import { IconDownload, IconFile } from '@tabler/icons-react';
import type { SubmissionFile } from '../../types';
import FileIcon from './FileIcon';
import { formatFileSize } from './utils';

type Props = {
	files: SubmissionFile[];
	selectedFile: SubmissionFile | null;
	onSelectFile: (file: SubmissionFile) => void;
};

export default function FileList({ files, selectedFile, onSelectFile }: Props) {
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
								<FileIcon filename={file.filename} />
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
