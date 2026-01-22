import { Group, Image, Stack, Text } from '@mantine/core';
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
			<DetailsViewBody gap={0}>
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
						{book.subtitle && (
							<FieldView label='Subtitle'>{book.subtitle}</FieldView>
						)}
						<FieldView label='Publisher'>{book.publisher}</FieldView>
						<FieldView label='Publication Year'>
							{book.publicationYear}
						</FieldView>
						<FieldView label='Authors'>
							<Group gap='xs'>
								<Text size='sm' variant='light'>
									{book.bookAuthors.map((ba) => ba.author.name).join(', ')}
								</Text>
							</Group>
						</FieldView>
					</Stack>
				</Group>
				{book.description && (
					<Stack gap='xs' mt='md'>
						<Text size='sm' fw={500} c='dimmed'>
							Description
						</Text>
						<Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
							{book.description}
						</Text>
					</Stack>
				)}
			</DetailsViewBody>
		</DetailsView>
	);
}
