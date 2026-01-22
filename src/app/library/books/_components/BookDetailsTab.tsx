import { Group, Image, NumberFormatter, Stack, Text } from '@mantine/core';
import { FieldView } from '@/shared/ui/adease';
import type { BookWithRelations } from '../_lib/types';

type Props = {
	book: BookWithRelations;
};

export default function BookDetailsTab({ book }: Props) {
	return (
		<>
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
					<FieldView label='Publication Year'>{book.publicationYear}</FieldView>
					{book.price && (
						<FieldView label='Price'>
							<NumberFormatter
								prefix='M'
								value={book.price}
								decimalScale={2}
								fixedDecimalScale
							/>
						</FieldView>
					)}
					<FieldView label='Authors'>
						<Group gap='xs'>
							<Text size='sm' variant='light'>
								{book.bookAuthors.map((ba) => ba.author.name).join(', ')}
							</Text>
						</Group>
					</FieldView>
				</Stack>
			</Group>
			{book.summary && (
				<Stack gap='xs' mt='md'>
					<Text size='sm' fw={500} c='dimmed'>
						Summary
					</Text>
					<Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
						{book.summary}
					</Text>
				</Stack>
			)}
		</>
	);
}
