'use client';

import { Box, Card, Group, Text } from '@mantine/core';
import { IconFile, IconLink } from '@tabler/icons-react';

type Props = {
	title: string;
	url: string | null | undefined;
	isFile: boolean;
};

export default function AttachmentCard({ title, url, isFile }: Props) {
	return (
		<Card
			withBorder
			padding='md'
			component={url ? 'a' : 'div'}
			href={url || undefined}
			target='_blank'
			style={{
				cursor: url ? 'pointer' : 'default',
				transition: 'all 0.2s',
			}}
			className={url ? 'hover-lift' : ''}
		>
			<Group gap='sm' wrap='nowrap'>
				<Box
					style={{
						color: 'var(--mantine-color-blue-6)',
					}}
				>
					{isFile ? <IconFile size='1.25rem' /> : <IconLink size='1.25rem' />}
				</Box>
				<Box style={{ flex: 1, minWidth: 0 }}>
					<Text
						size='sm'
						fw={500}
						style={{
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
						}}
					>
						{title}
					</Text>
					{url && (
						<Text size='xs' c='dimmed' lineClamp={1}>
							{url}
						</Text>
					)}
				</Box>
			</Group>
		</Card>
	);
}
