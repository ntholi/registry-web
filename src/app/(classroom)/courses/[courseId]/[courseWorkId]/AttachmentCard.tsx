'use client';

import { Card, Group, Text, ThemeIcon } from '@mantine/core';
import { IconFile, IconLink } from '@tabler/icons-react';

type Props = {
	title: string;
	url: string | null | undefined;
	isFile: boolean;
};

export default function AttachmentCard({ title, url, isFile }: Props) {
	const Icon = isFile ? IconFile : IconLink;
	const cardProps = url
		? {
				component: 'a' as const,
				href: url,
				target: '_blank',
				rel: 'noreferrer',
			}
		: undefined;

	return (
		<Card withBorder p='md' radius='md' {...cardProps}>
			<Group gap='sm' align='flex-start'>
				<ThemeIcon
					size='lg'
					radius='md'
					variant='light'
					color={isFile ? 'blue' : 'violet'}
				>
					<Icon size='1.1rem' />
				</ThemeIcon>
				<Text size='sm' fw={500} flex={1} truncate>
					{title}
				</Text>
			</Group>
		</Card>
	);
}
