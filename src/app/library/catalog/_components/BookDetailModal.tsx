'use client';

import {
	AspectRatio,
	Badge,
	Divider,
	Group,
	Image,
	Modal,
	SimpleGrid,
	Stack,
	Text,
	Title,
	UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBook } from '@tabler/icons-react';
import type { CatalogBook } from '../_server/types';

type Props = {
	book: CatalogBook;
	children: React.ReactNode;
};

export default function BookDetailModal({ book, children }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const isAvailable = book.availableCopies > 0;

	return (
		<>
			<UnstyledButton onClick={open} w='100%'>
				{children}
			</UnstyledButton>

			<Modal
				opened={opened}
				onClose={close}
				title={<Title order={4}>{book.title}</Title>}
				size='lg'
			>
				<Stack gap='md'>
					<Group align='flex-start' wrap='nowrap'>
						<AspectRatio ratio={3 / 4} w={150} miw={150}>
							{book.coverUrl ? (
								<Image
									src={book.coverUrl}
									alt={book.title}
									fit='cover'
									radius='md'
								/>
							) : (
								<Stack
									align='center'
									justify='center'
									bg='dark.6'
									h='100%'
									style={{ borderRadius: 'var(--mantine-radius-md)' }}
								>
									<IconBook size={48} color='var(--mantine-color-dimmed)' />
								</Stack>
							)}
						</AspectRatio>

						<Stack gap='xs' flex={1}>
							{book.subtitle && (
								<Text size='sm' c='dimmed' fs='italic'>
									{book.subtitle}
								</Text>
							)}

							{book.bookAuthors.length > 0 && (
								<Text size='sm'>
									<Text span fw={500}>
										Author{book.bookAuthors.length > 1 ? 's' : ''}:{' '}
									</Text>
									{book.bookAuthors.map((ba) => ba.author.name).join(', ')}
								</Text>
							)}

							{book.publisher && (
								<Text size='sm'>
									<Text span fw={500}>
										Publisher:{' '}
									</Text>
									{book.publisher}
								</Text>
							)}

							{book.publicationYear && (
								<Text size='sm'>
									<Text span fw={500}>
										Year:{' '}
									</Text>
									{book.publicationYear}
								</Text>
							)}

							<Text size='sm'>
								<Text span fw={500}>
									ISBN:{' '}
								</Text>
								{book.isbn}
							</Text>

							{book.price && (
								<Text size='sm'>
									<Text span fw={500}>
										Price:{' '}
									</Text>
									M {book.price.toFixed(2)}
								</Text>
							)}

							{book.bookCategories.length > 0 && (
								<Group gap='xs'>
									{book.bookCategories.map((bc) => (
										<Badge key={bc.categoryId} variant='light' size='sm'>
											{bc.category.name}
										</Badge>
									))}
								</Group>
							)}
						</Stack>
					</Group>

					<Divider />

					<SimpleGrid cols={2}>
						<Stack gap={4} align='center'>
							<Text size='xs' c='dimmed' tt='uppercase'>
								Availability
							</Text>
							<Badge
								size='lg'
								color={isAvailable ? 'teal' : 'red'}
								variant='light'
							>
								{isAvailable ? 'Available' : 'Unavailable'}
							</Badge>
						</Stack>
						<Stack gap={4} align='center'>
							<Text size='xs' c='dimmed' tt='uppercase'>
								Copies
							</Text>
							<Text fw={600} size='lg'>
								{book.availableCopies} / {book.totalCopies}
							</Text>
						</Stack>
					</SimpleGrid>

					{book.summary && (
						<>
							<Divider />
							<Stack gap='xs'>
								<Text fw={500} size='sm'>
									Summary
								</Text>
								<Text size='sm' c='dimmed'>
									{book.summary}
								</Text>
							</Stack>
						</>
					)}
				</Stack>
			</Modal>
		</>
	);
}
