'use client';

import {
	ActionIcon,
	Box,
	Center,
	Image,
	Paper,
	Stack,
	Text,
} from '@mantine/core';
import { IconPhoto, IconX } from '@tabler/icons-react';

type Props = {
	coverUrl: string;
	onCoverChange: (url: string) => void;
};

export default function CoverImage({ coverUrl, onCoverChange }: Props) {
	return (
		<Stack>
			<Text size='sm' fw={500}>
				Cover Image
			</Text>
			<Paper
				withBorder
				radius='md'
				p={0}
				style={{ overflow: 'hidden', position: 'relative' }}
			>
				{coverUrl ? (
					<Box pos='relative'>
						<Image
							src={coverUrl}
							alt='Book cover'
							w={180}
							h={240}
							fit='cover'
						/>
						<ActionIcon
							variant='filled'
							color='red'
							size='sm'
							pos='absolute'
							top={8}
							right={8}
							onClick={() => onCoverChange('')}
						>
							<IconX size={14} />
						</ActionIcon>
					</Box>
				) : (
					<Center h={240} w={180} bg='dark.6'>
						<Stack align='center' gap='xs'>
							<IconPhoto size={48} opacity={0.3} />
							<Text size='xs' c='dimmed'>
								No cover
							</Text>
						</Stack>
					</Center>
				)}
			</Paper>
		</Stack>
	);
}
