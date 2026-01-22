'use client';

import {
	Anchor,
	Badge,
	Button,
	Divider,
	Group,
	Modal,
	Stack,
	Text,
	Title,
	UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
	IconArticle,
	IconBook2,
	IconCalendar,
	IconDownload,
	IconFileText,
	IconSchool,
	IconUser,
} from '@tabler/icons-react';
import type { CatalogPublication } from '../_server/types';

type Props = {
	publication: CatalogPublication;
	children: React.ReactNode;
};

const typeConfig = {
	ResearchPaper: { color: 'blue', icon: IconArticle, label: 'Research Paper' },
	Thesis: { color: 'violet', icon: IconSchool, label: 'Thesis' },
	Journal: { color: 'teal', icon: IconBook2, label: 'Journal' },
	Other: { color: 'gray', icon: IconFileText, label: 'Other' },
} as const;

export default function PublicationDetailModal({
	publication,
	children,
}: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const config = typeConfig[publication.type];
	const Icon = config.icon;
	const authors = publication.publicationAuthors
		.map((pa) => pa.author.name)
		.join(', ');

	return (
		<>
			<UnstyledButton onClick={open} w='100%'>
				{children}
			</UnstyledButton>

			<Modal
				opened={opened}
				onClose={close}
				title={
					<Group gap='sm'>
						<Icon size={20} color={`var(--mantine-color-${config.color}-6)`} />
						<Badge color={config.color} variant='light'>
							{config.label}
						</Badge>
					</Group>
				}
				size='lg'
			>
				<Stack gap='md'>
					<Title order={3} lh={1.3}>
						{publication.title}
					</Title>

					{authors && (
						<Group gap='xs'>
							<IconUser size={16} color='var(--mantine-color-dimmed)' />
							<Text size='sm' c='dimmed'>
								{authors}
							</Text>
						</Group>
					)}

					{publication.datePublished && (
						<Group gap='xs'>
							<IconCalendar size={16} color='var(--mantine-color-dimmed)' />
							<Text size='sm' c='dimmed'>
								{publication.datePublished}
							</Text>
						</Group>
					)}

					{publication.abstract && (
						<>
							<Divider />
							<Stack gap='xs'>
								<Text fw={500} size='sm'>
									Abstract
								</Text>
								<Text size='sm' c='dimmed' style={{ whiteSpace: 'pre-wrap' }}>
									{publication.abstract}
								</Text>
							</Stack>
						</>
					)}

					<Divider />

					<Group justify='space-between'>
						<Anchor
							href={`/library/resources/publications/${publication.id}`}
							size='sm'
						>
							View full details
						</Anchor>
						{publication.document?.fileUrl && (
							<Button
								component='a'
								href={publication.document.fileUrl}
								target='_blank'
								leftSection={<IconDownload size={16} />}
								variant='light'
								size='sm'
							>
								Download
							</Button>
						)}
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
