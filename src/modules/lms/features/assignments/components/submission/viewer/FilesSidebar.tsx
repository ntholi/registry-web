'use client';

import { NavLink, ScrollArea, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconFile } from '@tabler/icons-react';
import type { SubmissionFile } from '../../../types';
import FileIcon from '../FileIcon';
import { formatFileSize } from '../utils';

type Props = {
	files: SubmissionFile[];
	selectedIndex: number;
	onSelectFile: (index: number) => void;
};

export default function FilesSidebar({
	files,
	selectedIndex,
	onSelectFile,
}: Props) {
	if (files.length === 0) {
		return (
			<Stack align='center' py='xl'>
				<ThemeIcon size={48} variant='light' color='gray'>
					<IconFile size={24} />
				</ThemeIcon>
				<Text c='dimmed' size='sm'>
					No files submitted
				</Text>
			</Stack>
		);
	}

	return (
		<Stack gap='xs' h='100%'>
			<Text size='xs' fw={600} tt='uppercase'>
				Files ({files.length})
			</Text>
			<ScrollArea h='calc(100vh - 400px)' type='auto'>
				<Stack gap={4}>
					{files.map((file, index) => (
						<NavLink
							key={`${file.filename}-${index}`}
							active={index === selectedIndex}
							label={file.filename}
							description={formatFileSize(file.filesize)}
							leftSection={
								<ThemeIcon variant='light' color='gray' size='sm'>
									<FileIcon filename={file.filename} />
								</ThemeIcon>
							}
							onClick={() => onSelectFile(index)}
							styles={{
								label: {
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
								},
							}}
						/>
					))}
				</Stack>
			</ScrollArea>
		</Stack>
	);
}
