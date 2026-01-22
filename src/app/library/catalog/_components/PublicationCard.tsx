'use client';

import { Badge, Card, Group, Stack, Text, Title } from '@mantine/core';
import {
	IconArticle,
	IconBook2,
	IconFileText,
	IconSchool,
} from '@tabler/icons-react';
import Link from 'next/link';
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
		<Card
			component={Link}
			href={`/library/resources/publications/${publication.id}`}
			shadow='sm'
			padding='lg'
			radius='md'
			withBorder
			style={{ textDecoration: 'none' }}
		>
			<Stack gap='sm'>
				<Group justify='space-between' align='flex-start'>
					<Badge
						leftSection={<Icon size={12} />}
						color={config.color}
						variant='light'
					>
						{config.label}
					</Badge>
					{publication.datePublished && (
						<Text size='xs' c='dimmed'>
							{publication.datePublished}
						</Text>
					)}
				</Group>

				<Title order={5} lineClamp={2} lh={1.3}>
					{publication.title}
				</Title>

				{authors && (
					<Text size='sm' c='dimmed' lineClamp={1}>
						{authors}
					</Text>
				)}

				{publication.abstract && (
					<Text size='xs' c='dimmed' lineClamp={2}>
						{publication.abstract}
					</Text>
				)}
			</Stack>
		</Card>
	);
}
