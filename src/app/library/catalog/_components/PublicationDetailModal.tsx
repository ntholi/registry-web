'use client';

import {
	Badge,
	Box,
	Button,
	Divider,
	Group,
	Modal,
	ScrollArea,
	Stack,
	Tabs,
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
	IconEye,
	IconFileText,
	IconInfoCircle,
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
	const hasDocument = publication.document?.fileUrl;

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
				size='xl'
				styles={{ body: { padding: 0 } }}
			>
				<Tabs defaultValue={'details'}>
					<Tabs.List px='md'>
						<Tabs.Tab
							value='details'
							leftSection={<IconInfoCircle size={16} />}
						>
							Details
						</Tabs.Tab>
						{hasDocument && (
							<Tabs.Tab value='preview' leftSection={<IconEye size={16} />}>
								Preview
							</Tabs.Tab>
						)}
					</Tabs.List>

					{hasDocument && (
						<Tabs.Panel value='preview'>
							<Box h={500}>
								<iframe
									src={publication.document.fileUrl ?? undefined}
									title={publication.title}
									width='100%'
									height='100%'
									style={{ border: 'none' }}
								/>
							</Box>
						</Tabs.Panel>
					)}

					<Tabs.Panel value='details'>
						<ScrollArea mih={400}>
							<Stack gap='md' p='md'>
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
										<IconCalendar
											size={16}
											color='var(--mantine-color-dimmed)'
										/>
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
											<Text
												size='sm'
												c='dimmed'
												style={{ whiteSpace: 'pre-wrap' }}
											>
												{publication.abstract}
											</Text>
										</Stack>
									</>
								)}

								{hasDocument && (
									<>
										<Divider />
										<Button
											component='a'
											href={publication.document.fileUrl ?? undefined}
											target='_blank'
											leftSection={<IconDownload size={16} />}
											variant='light'
										>
											Download Document
										</Button>
									</>
								)}
							</Stack>
						</ScrollArea>
					</Tabs.Panel>
				</Tabs>
			</Modal>
		</>
	);
}
