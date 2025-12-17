'use client';

import {
	IconFile,
	IconFileCode,
	IconFileText,
	IconFileTypePdf,
	IconPhoto,
	IconVideo,
} from '@tabler/icons-react';

type Props = {
	filename: string;
	size?: number;
};

export default function FileIcon({ filename, size = 20 }: Props) {
	const extension = filename.split('.').pop()?.toLowerCase() || '';

	if (extension === 'pdf') {
		return <IconFileTypePdf size={size} />;
	}
	if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
		return <IconPhoto size={size} />;
	}
	if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(extension)) {
		return <IconVideo size={size} />;
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
		return <IconFileCode size={size} />;
	}
	if (['txt', 'log', 'csv', 'md'].includes(extension)) {
		return <IconFileText size={size} />;
	}

	return <IconFile size={size} />;
}
