'use client';

import { Box, Center, Loader, Stack, Text, ThemeIcon } from '@mantine/core';
import {
	IconFile,
	IconFileCode,
	IconFileSpreadsheet,
	IconFileText,
	IconFileTypePdf,
	IconFileZip,
	IconPhoto,
} from '@tabler/icons-react';
import type { SubmissionFile } from '../../../types';

type Props = {
	file: SubmissionFile | null;
	isLoading?: boolean;
};

function getFileType(
	mimetype: string
): 'image' | 'pdf' | 'office' | 'code' | 'text' | 'archive' | 'unknown' {
	if (mimetype.startsWith('image/')) return 'image';
	if (mimetype === 'application/pdf') return 'pdf';
	if (
		mimetype.includes('word') ||
		mimetype.includes('spreadsheet') ||
		mimetype.includes('presentation') ||
		mimetype.includes('msword') ||
		mimetype.includes('excel') ||
		mimetype.includes('powerpoint') ||
		mimetype.includes('opendocument')
	)
		return 'office';
	if (
		mimetype.includes('javascript') ||
		mimetype.includes('json') ||
		mimetype.includes('xml') ||
		mimetype.includes('html') ||
		mimetype.includes('css') ||
		mimetype.includes('python') ||
		mimetype.includes('java') ||
		mimetype.includes('c') ||
		mimetype.includes('cpp')
	)
		return 'code';
	if (mimetype.startsWith('text/')) return 'text';
	if (
		mimetype.includes('zip') ||
		mimetype.includes('rar') ||
		mimetype.includes('tar') ||
		mimetype.includes('gzip')
	)
		return 'archive';
	return 'unknown';
}

function getFileIcon(fileType: string) {
	switch (fileType) {
		case 'image':
			return <IconPhoto size={48} />;
		case 'pdf':
			return <IconFileTypePdf size={48} />;
		case 'office':
			return <IconFileSpreadsheet size={48} />;
		case 'code':
			return <IconFileCode size={48} />;
		case 'text':
			return <IconFileText size={48} />;
		case 'archive':
			return <IconFileZip size={48} />;
		default:
			return <IconFile size={48} />;
	}
}

function addMoodleToken(url: string): string {
	const token = process.env.NEXT_PUBLIC_MOODLE_TOKEN;
	if (!token) return url;
	const separator = url.includes('?') ? '&' : '?';
	return `${url}${separator}token=${token}`;
}

export default function FilePreview({ file, isLoading }: Props) {
	if (isLoading) {
		return (
			<Center h='100%'>
				<Stack align='center' gap='md'>
					<Loader size='lg' />
					<Text c='dimmed' size='sm'>
						Loading file...
					</Text>
				</Stack>
			</Center>
		);
	}

	if (!file) {
		return (
			<Center h='100%'>
				<Stack align='center' gap='md'>
					<ThemeIcon size={80} variant='light' color='gray'>
						<IconFile size={40} />
					</ThemeIcon>
					<Text c='dimmed' size='sm'>
						No file selected
					</Text>
				</Stack>
			</Center>
		);
	}

	const fileType = getFileType(file.mimetype);
	const fileUrl = addMoodleToken(file.fileurl);

	if (fileType === 'image') {
		return (
			<Center h='100%' p='md'>
				<Box
					component='img'
					src={fileUrl}
					alt={file.filename}
					style={{
						maxWidth: '100%',
						maxHeight: '100%',
						objectFit: 'contain',
					}}
				/>
			</Center>
		);
	}

	if (fileType === 'pdf') {
		return (
			<Box h='100%' w='100%'>
				<iframe
					src={fileUrl}
					title={file.filename}
					style={{
						width: '100%',
						height: '100%',
						border: 'none',
					}}
				/>
			</Box>
		);
	}

	if (fileType === 'office') {
		const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
		return (
			<Box h='100%' w='100%'>
				<iframe
					src={viewerUrl}
					title={file.filename}
					style={{
						width: '100%',
						height: '100%',
						border: 'none',
					}}
				/>
			</Box>
		);
	}

	return (
		<Center h='100%'>
			<Stack align='center' gap='lg'>
				<ThemeIcon size={80} variant='light' color='gray'>
					{getFileIcon(fileType)}
				</ThemeIcon>
				<Stack align='center' gap='xs'>
					<Text fw={500}>{file.filename}</Text>
					<Text c='dimmed' size='sm'>
						Preview not available for this file type
					</Text>
					<Text
						component='a'
						href={fileUrl}
						target='_blank'
						rel='noopener noreferrer'
						c='blue'
						size='sm'
						td='underline'
					>
						Download to view
					</Text>
				</Stack>
			</Stack>
		</Center>
	);
}
