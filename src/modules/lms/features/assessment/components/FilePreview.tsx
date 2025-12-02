'use client';

import {
	Box,
	Button,
	Code,
	Loader,
	ScrollArea,
	Stack,
	Text,
	useComputedColorScheme,
	useMantineTheme,
} from '@mantine/core';
import { IconDownload, IconFile } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import type { SubmissionFile } from '../types';

type Props = {
	file: SubmissionFile;
};

type FileType =
	| 'pdf'
	| 'image'
	| 'video'
	| 'code'
	| 'text'
	| 'word'
	| 'unknown';

const codeExtensions = [
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
	'scala',
	'html',
	'css',
	'scss',
	'sass',
	'less',
	'json',
	'xml',
	'yaml',
	'yml',
	'md',
	'sql',
	'sh',
	'bash',
	'ps1',
	'r',
	'lua',
	'pl',
	'asm',
	'v',
	'vhdl',
];

const textExtensions = ['txt', 'log', 'csv'];

function getFileType(file: SubmissionFile): FileType {
	const extension = file.filename.split('.').pop()?.toLowerCase() || '';

	if (extension === 'pdf') return 'pdf';
	if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
		return 'image';
	}
	if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(extension)) return 'video';
	if (codeExtensions.includes(extension)) return 'code';
	if (textExtensions.includes(extension)) return 'text';
	if (['doc', 'docx', 'odt', 'rtf'].includes(extension)) return 'word';

	return 'unknown';
}

async function fetchTextContent(url: string): Promise<string> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error('Failed to fetch file content');
	}
	return response.text();
}

function CodePreview({ file }: Props) {
	const theme = useMantineTheme();
	const colorScheme = useComputedColorScheme('dark');

	const { data: content, isLoading } = useQuery({
		queryKey: ['file-content', file.fileurl],
		queryFn: () => fetchTextContent(file.fileurl),
	});

	if (isLoading) {
		return (
			<Box py='xl' ta='center'>
				<Loader size='md' />
			</Box>
		);
	}

	return (
		<ScrollArea h='65vh'>
			<Code
				block
				style={{
					backgroundColor:
						colorScheme === 'dark'
							? theme.colors.dark[8]
							: theme.colors.gray[0],
					fontSize: '0.8rem',
					lineHeight: 1.6,
				}}
			>
				{content}
			</Code>
		</ScrollArea>
	);
}

function TextPreview({ file }: Props) {
	const theme = useMantineTheme();
	const colorScheme = useComputedColorScheme('dark');

	const { data: content, isLoading } = useQuery({
		queryKey: ['file-content', file.fileurl],
		queryFn: () => fetchTextContent(file.fileurl),
	});

	if (isLoading) {
		return (
			<Box py='xl' ta='center'>
				<Loader size='md' />
			</Box>
		);
	}

	return (
		<ScrollArea h='65vh'>
			<Box
				p='md'
				style={{
					backgroundColor:
						colorScheme === 'dark'
							? theme.colors.dark[7]
							: theme.colors.gray[0],
					borderRadius: theme.radius.md,
					whiteSpace: 'pre-wrap',
					fontFamily: 'monospace',
					fontSize: '0.875rem',
				}}
			>
				{content}
			</Box>
		</ScrollArea>
	);
}

export default function FilePreview({ file }: Props) {
	const theme = useMantineTheme();
	const colorScheme = useComputedColorScheme('dark');
	const fileType = getFileType(file);

	if (fileType === 'pdf') {
		return (
			<Box
				style={{
					height: '70vh',
					borderRadius: theme.radius.md,
					overflow: 'hidden',
					border: `1px solid ${
						colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[3]
					}`,
				}}
			>
				<iframe
					src={file.fileurl}
					style={{
						width: '100%',
						height: '100%',
						border: 'none',
					}}
					title={file.filename}
				/>
			</Box>
		);
	}

	if (fileType === 'image') {
		return (
			<Box
				style={{
					maxHeight: '70vh',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor:
						colorScheme === 'dark'
							? theme.colors.dark[7]
							: theme.colors.gray[0],
					borderRadius: theme.radius.md,
					padding: theme.spacing.md,
				}}
			>
				{/* biome-ignore lint/a11y/useAltText: Student submission file preview */}
				{/* biome-ignore lint/performance/noImgElement: External file from Moodle */}
				<img
					src={file.fileurl}
					style={{
						maxWidth: '100%',
						maxHeight: '65vh',
						objectFit: 'contain',
						borderRadius: theme.radius.sm,
					}}
				/>
			</Box>
		);
	}

	if (fileType === 'video') {
		return (
			<Box
				style={{
					maxHeight: '70vh',
					borderRadius: theme.radius.md,
					overflow: 'hidden',
				}}
			>
				{/* biome-ignore lint/a11y/useMediaCaption: Student submission video */}
				<video
					controls
					style={{
						width: '100%',
						maxHeight: '70vh',
						borderRadius: theme.radius.md,
					}}
				>
					<source src={file.fileurl} />
					Your browser does not support the video tag.
				</video>
			</Box>
		);
	}

	if (fileType === 'code') {
		return <CodePreview file={file} />;
	}

	if (fileType === 'text') {
		return <TextPreview file={file} />;
	}

	if (fileType === 'word') {
		const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.fileurl)}`;
		return (
			<Box
				style={{
					height: '70vh',
					borderRadius: theme.radius.md,
					overflow: 'hidden',
					border: `1px solid ${
						colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[3]
					}`,
				}}
			>
				<iframe
					src={officeViewerUrl}
					style={{
						width: '100%',
						height: '100%',
						border: 'none',
					}}
					title={file.filename}
				/>
			</Box>
		);
	}

	return (
		<Box py='xl' ta='center'>
			<Stack align='center' gap='md'>
				<IconFile
					size={64}
					stroke={1}
					style={{ color: theme.colors.gray[5] }}
				/>
				<Text c='dimmed' size='sm'>
					Preview not available for this file type
				</Text>
				<Button
					component='a'
					href={file.fileurl}
					target='_blank'
					rel='noopener noreferrer'
					leftSection={<IconDownload size={16} />}
				>
					Download File
				</Button>
			</Stack>
		</Box>
	);
}
