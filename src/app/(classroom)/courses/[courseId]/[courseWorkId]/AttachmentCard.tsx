'use client';

import { Box, Card, Group, Text } from '@mantine/core';
import { IconFile, IconLink } from '@tabler/icons-react';

type Props = {
	title: string;
	url: string | null | undefined;
	isFile: boolean;
};

export default function AttachmentCard({ title, url, isFile }: Props) {
	const content = (
		<Group gap='sm' wrap='nowrap'>
			<Box c='blue'>
				{isFile ? <IconFile size='1.25rem' /> : <IconLink size='1.25rem' />}
			</Box>
			<Box style={{ flex: 1, minWidth: 0 }}>
				<Text size='sm' fw={500} truncate>
					{title}
				</Text>
			</Box>
		</Group>
	);

	if (url) {
		return (
			<Card
				withBorder
				p='md'
				radius='sm'
				component='a'
				href={url}
				target='_blank'
			>
				{content}
			</Card>
		);
	}

	return (
		<Card withBorder p='md' radius='sm'>
			{content}
		</Card>
	);
}
