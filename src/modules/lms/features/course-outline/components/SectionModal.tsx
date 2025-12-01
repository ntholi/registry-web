'use client';

import {
	Box,
	Modal,
	Text,
	useComputedColorScheme,
	useMantineTheme,
} from '@mantine/core';
import type { CourseSection } from '../types';

type SectionModalProps = {
	section: CourseSection | null;
	onClose: () => void;
};

export default function SectionModal({ section, onClose }: SectionModalProps) {
	const theme = useMantineTheme();
	const colorScheme = useComputedColorScheme('dark');

	return (
		<Modal
			opened={section !== null}
			onClose={onClose}
			size='lg'
			title={
				<Text fw={600} size='lg'>
					{section?.name}
				</Text>
			}
			padding='md'
		>
			{section && (
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
							__html: section.content || 'No content available',
						}}
					/>
				</Box>
			)}
		</Modal>
	);
}
