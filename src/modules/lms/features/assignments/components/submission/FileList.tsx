'use client';

import {
	ActionIcon,
	Box,
	Grid,
	Group,
	Paper,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { IconDownload, IconExternalLink, IconFile } from '@tabler/icons-react';
import type { SubmissionFile } from '../../types';
import FileIcon from './FileIcon';
import { formatFileSize } from './utils';

type Props = {
	files: SubmissionFile[];
	viewerUrl?: string;
};

export default function FileList({ files, viewerUrl }: Props) {
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

	function handleFileClick(index: number) {
		if (viewerUrl) {
			window.open(`${viewerUrl}?fileIndex=${index}`, '_blank');
		}
	}

	return (
		<Grid gutter='xs'>
			{files.map((file, index) => (
				<Grid.Col key={`${file.filename}-${index}`} span={6}>
					<Paper
						p='sm'
						withBorder
						style={{
							cursor: viewerUrl ? 'pointer' : 'default',
							transition: 'background-color 150ms ease',
						}}
						onClick={() => handleFileClick(index)}
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
							<Group gap={4}>
								{viewerUrl && (
									<ActionIcon
										variant='subtle'
										color='gray'
										onClick={(e) => {
											e.stopPropagation();
											handleFileClick(index);
										}}
									>
										<IconExternalLink size={16} />
									</ActionIcon>
								)}
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
						</Group>
					</Paper>
				</Grid.Col>
			))}
		</Grid>
	);
}
