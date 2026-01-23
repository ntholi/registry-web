'use client';

import { Badge, Box, Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import {
	IconArticle,
	IconBook2,
	IconFileText,
	IconSchool,
	IconUser,
} from '@tabler/icons-react';
import type { CatalogPublication } from '../_server/types';

type Props = {
	publication: CatalogPublication;
};

const typeConfig = {
	ResearchPaper: { color: 'blue', icon: IconArticle, label: 'Research Paper' },
	Thesis: { color: 'violet', icon: IconSchool, label: 'Thesis' },
	Journal: { color: 'teal', icon: IconBook2, label: 'Journal' },
	Other: { color: 'gray', icon: IconFileText, label: 'Other' },
} as const;

export default function PublicationCard({ publication }: Props) {
	const config = typeConfig[publication.type];
	const Icon = config.icon;
	const authors = publication.publicationAuthors
		.map((pa) => pa.author.name)
		.join(', ');

	return (
		<Card shadow='sm' padding={0} radius='md' withBorder h={245}>
			<Box px='md' py={'sm'} bg={`var(--mantine-color-dark-5)`}>
				<Group justify='space-between' align='flex-start'>
					<ThemeIcon variant='light' color='gray' size='xl' radius='md'>
						<Icon size={24} />
					</ThemeIcon>
					<Badge variant='default' size='sm'>
						{config.label}
					</Badge>
				</Group>
			</Box>

			<Stack gap='sm' p='md' justify='space-between' flex={1}>
				<Stack gap='xs'>
					<Text fw={600} lineClamp={2} lh={1.3}>
						{publication.title}
					</Text>

					{authors && (
						<Group gap='xs' wrap='nowrap'>
							<IconUser size={14} color='var(--mantine-color-dimmed)' />
							<Text size='sm' c='dimmed' lineClamp={1}>
								{authors}
							</Text>
						</Group>
					)}

					{publication.abstract && (
						<Text size='sm' c='dimmed' lineClamp={2}>
							{publication.abstract}
						</Text>
					)}
				</Stack>

				{publication.datePublished && (
					<Text size='xs' c='dimmed' ta='right'>
						{publication.datePublished}
					</Text>
				)}
			</Stack>
		</Card>
	);
}
