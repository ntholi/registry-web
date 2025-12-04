'use client';

import {
	ActionIcon,
	Box,
	Button,
	Group,
	Loader,
	Modal,
	Stack,
	Text,
	useComputedColorScheme,
	useMantineTheme,
} from '@mantine/core';
import { IconExternalLink, IconFileText } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getMaterialContent } from '../server/actions';

type Material = {
	id: number;
	url: string;
	name: string;
	modname: string;
	visible: number;
	instance: number;
};

type MaterialPreviewModalProps = {
	material: Material | null;
	onClose: () => void;
};

function getFileType(url: string): 'pdf' | 'image' | 'video' | 'unknown' {
	const extension = url.split('.').pop()?.toLowerCase();

	if (extension === 'pdf') return 'pdf';
	if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || ''))
		return 'image';
	if (['mp4', 'webm', 'ogg'].includes(extension || '')) return 'video';

	return 'unknown';
}

function MaterialPreview({ material }: { material: Material }) {
	const theme = useMantineTheme();
	const colorScheme = useComputedColorScheme('dark');
	const { data: contentData, isLoading } = useQuery({
		queryKey: ['material-content', material.id],
		queryFn: () =>
			getMaterialContent(material.id, material.modname, material.instance),
		enabled: material.modname === 'page',
	});

	if (material.modname === 'page') {
		if (isLoading) {
			return (
				<Box py='xl' ta='center'>
					<Loader size='md' />
				</Box>
			);
		}

		return (
			<Box
				p='md'
				style={{
					maxHeight: '60vh',
					overflowY: 'auto',
					backgroundColor:
						colorScheme === 'dark'
							? theme.colors.dark[7]
							: theme.colors.gray[0],
					borderRadius: theme.radius.md,
				}}
			>
				<div
					dangerouslySetInnerHTML={{
						__html: contentData?.content || 'Content not available',
					}}
				/>
			</Box>
		);
	}

	const fileType = getFileType(material.url);

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
					src={material.url}
					style={{
						width: '100%',
						height: '100%',
						border: 'none',
					}}
					title={material.name}
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
				{/* biome-ignore lint/performance/noImgElement: Displaying remote Moodle images with dynamic URLs */}
				<img
					src={material.url}
					alt={material.name}
					style={{
						maxWidth: '100%',
						maxHeight: '100%',
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
				{/* biome-ignore lint/a11y/useMediaCaption: User-uploaded videos from Moodle may not have captions */}
				<video
					controls
					style={{
						width: '100%',
						maxHeight: '70vh',
						borderRadius: theme.radius.md,
					}}
				>
					<source src={material.url} />
					Your browser does not support the video tag.
				</video>
			</Box>
		);
	}

	return (
		<Box py='xl' ta='center'>
			<Stack align='center' gap='md'>
				<IconFileText
					size={64}
					stroke={1}
					style={{ color: theme.colors.gray[5] }}
				/>
				<Text c='dimmed' size='sm'>
					Preview not available for this file type
				</Text>
				<Button
					component='a'
					href={material.url}
					target='_blank'
					rel='noopener noreferrer'
					leftSection={<IconExternalLink size={16} />}
				>
					Open in Moodle
				</Button>
			</Stack>
		</Box>
	);
}

export default function MaterialPreviewModal({
	material,
	onClose,
}: MaterialPreviewModalProps) {
	return (
		<Modal
			opened={material !== null}
			onClose={onClose}
			size='xl'
			title={
				<Group gap='sm'>
					<Text fw={600} size='lg'>
						{material?.name}
					</Text>
					{material && (
						<ActionIcon
							variant='subtle'
							color='gray'
							component='a'
							href={material.url}
							target='_blank'
							rel='noopener noreferrer'
							onClick={(e) => e.stopPropagation()}
						>
							<IconExternalLink size={18} />
						</ActionIcon>
					)}
				</Group>
			}
			padding='md'
		>
			{material && <MaterialPreview material={material} />}
		</Modal>
	);
}
