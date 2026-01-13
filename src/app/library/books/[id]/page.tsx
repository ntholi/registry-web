import { Badge, Button, Group, Image, Stack, Text } from '@mantine/core';
import { IconBook } from '@tabler/icons-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import { deleteBook, getBook } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function BookDetailsPage({ params }: Props) {
	const { id } = await params;
	const book = await getBook(Number(id));

	if (!book) return notFound();

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Book'
				queryKey={['books']}
				handleDelete={async () => {
					'use server';
					await deleteBook(Number(id));
				}}
			/>
			<DetailsViewBody>
				<Group align='flex-start'>
					{book.coverUrl && (
						<Image
							src={book.coverUrl}
							alt={book.title}
							w={150}
							h={200}
							fit='contain'
							radius='md'
						/>
					)}
					<Stack flex={1} gap='xs'>
						<FieldView label='ISBN'>{book.isbn}</FieldView>
						<FieldView label='Title'>{book.title}</FieldView>
						<FieldView label='Publisher'>{book.publisher}</FieldView>
						<FieldView label='Publication Year'>
							{book.publicationYear}
						</FieldView>
						<FieldView label='Edition'>{book.edition}</FieldView>
						<FieldView label='Authors'>
							<Group gap='xs'>
								{book.bookAuthors.map((ba) => (
									<Badge key={ba.authorId} variant='light'>
										{ba.author.name}
									</Badge>
								))}
							</Group>
						</FieldView>
						<FieldView label='Categories'>
							<Group gap='xs'>
								{book.bookCategories.map((bc) => (
									<Badge key={bc.categoryId} variant='outline'>
										{bc.category.name}
									</Badge>
								))}
							</Group>
						</FieldView>
						<FieldView label='Copies'>
							<Group gap='xs'>
								<Text size='sm'>
									{book.availableCopies} available / {book.totalCopies} total
								</Text>
								<Button
									component={Link}
									href={`/library/books/${id}/copies`}
									size='xs'
									variant='light'
									leftSection={<IconBook size={14} />}
								>
									Manage Copies
								</Button>
							</Group>
						</FieldView>
					</Stack>
				</Group>
			</DetailsViewBody>
		</DetailsView>
	);
}
