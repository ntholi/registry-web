'use client';

import {
	AspectRatio,
	Badge,
	Card,
	Group,
	Image,
	Stack,
	Text,
} from '@mantine/core';
import { IconBook } from '@tabler/icons-react';
import type { CatalogBook } from '../_server/types';

type Props = {
	book: CatalogBook;
};

export default function BookCard({ book }: Props) {
	const primaryAuthor = book.bookAuthors[0]?.author?.name;
	const hasMore = book.bookAuthors.length > 1;
	const isAvailable = book.availableCopies > 0;

	return (
		<Card shadow='sm' padding='md' radius='md' withBorder>
			<Card.Section>
				<AspectRatio ratio={3 / 4}>
					{book.coverUrl ? (
						<Image src={book.coverUrl} alt={book.title} fit='cover' />
					) : (
						<Stack align='center' justify='center' bg='dark.6' h='100%'>
							<IconBook size={48} color='var(--mantine-color-dimmed)' />
						</Stack>
					)}
				</AspectRatio>
			</Card.Section>

			<Stack gap='xs' mt='md'>
				<Text fw={600} lineClamp={2} size='sm' lh={1.3}>
					{book.title}
				</Text>

				{primaryAuthor && (
					<Text size='xs' c='dimmed' lineClamp={1}>
						{primaryAuthor}
						{hasMore && ` +${book.bookAuthors.length - 1}`}
					</Text>
				)}

				<Group justify='space-between' mt='xs'>
					<Badge size='sm' color={isAvailable ? 'teal' : 'red'} variant='light'>
						{isAvailable ? 'Available' : 'Unavailable'}
					</Badge>
					{book.availableCopies > 0 && (
						<Text size='xs' c='dimmed'>
							{book.availableCopies} copies
						</Text>
					)}
				</Group>
			</Stack>
		</Card>
	);
}
