'use client';

import { books } from '@library/_database';
import {
	Box,
	Grid,
	MultiSelect,
	NumberInput,
	Paper,
	Stack,
	Textarea,
	TextInput,
} from '@mantine/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { Form } from '@/shared/ui/adease';
import type { BookLookupResult } from '../../_lib/google-books';
import {
	getAllAuthors,
	getOrCreateAuthors,
} from '../../authors/_server/actions';
import type { BookWithRelations } from '../_lib/types';
import BookLookupModal from './BookLookupModal';
import CategoriesSelect from './CategoriesSelect';
import CoverImage from './CoverImage';

type Book = typeof books.$inferInsert;

type Props = {
	onSubmit: (
		values: Book,
		authorIds: number[],
		categoryIds: number[]
	) => Promise<Book>;
	defaultValues?: BookWithRelations;
	title?: string;
};

export default function BookForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [coverUrl, setCoverUrl] = useState(defaultValues?.coverUrl ?? '');
	const [authorIds, setAuthorIds] = useState<string[]>(
		defaultValues?.bookAuthors?.map((ba) => String(ba.authorId)) ?? []
	);
	const [categoryIds, setCategoryIds] = useState<string[]>(
		defaultValues?.bookCategories?.map((bc) => String(bc.categoryId)) ?? []
	);
	const [isbn, setIsbn] = useState(defaultValues?.isbn ?? '');
	const [bookTitle, setBookTitle] = useState(defaultValues?.title ?? '');

	const { data: authorsData } = useQuery({
		queryKey: ['authors', 'all'],
		queryFn: getAllAuthors,
	});

	const authorOptions =
		authorsData?.map((a) => ({ value: String(a.id), label: a.name })) ?? [];

	async function handleBookSelect(
		book: BookLookupResult,
		form: {
			setFieldValue: (field: string, value: string | number | null) => void;
		}
	) {
		if (book.thumbnail) setCoverUrl(book.thumbnail);
		if (book.title) {
			setBookTitle(book.title);
			form.setFieldValue('title', book.title);
		}
		if (book.subtitle) form.setFieldValue('subtitle', book.subtitle);
		if (book.description) form.setFieldValue('description', book.description);
		if (book.isbn) {
			setIsbn(book.isbn);
			form.setFieldValue('isbn', book.isbn);
		}
		if (book.publisher) form.setFieldValue('publisher', book.publisher);
		if (book.publishedDate) {
			const year = Number.parseInt(book.publishedDate.slice(0, 4), 10);
			if (!Number.isNaN(year)) form.setFieldValue('publicationYear', year);
		}
		if (book.authors.length > 0) {
			const created = await getOrCreateAuthors(book.authors);
			setAuthorIds(created.map((a) => String(a.id)));
			await queryClient.invalidateQueries({ queryKey: ['authors', 'all'] });
		}
	}

	return (
		<Form
			title={title}
			action={async (values) => {
				const result = await onSubmit(
					{ ...values, coverUrl } as typeof books.$inferInsert,
					authorIds.map(Number),
					categoryIds.map(Number)
				);
				return result;
			}}
			queryKey={['books']}
			schema={createInsertSchema(books).omit({ coverUrl: true })}
			defaultValues={defaultValues}
			onSuccess={({ id }) => router.push(`/library/books/${id}`)}
		>
			{(form) => (
				<Stack>
					<Grid gutter='xl'>
						<Grid.Col span={{ base: 12, sm: 'auto' }}>
							<Stack>
								<Box pos='relative' pb='md'>
									<Paper withBorder px='xl' py={50}>
										<Stack>
											<TextInput
												label='ISBN'
												{...form.getInputProps('isbn')}
												required
												onChange={(e) => {
													form.getInputProps('isbn').onChange(e);
													setIsbn(e.currentTarget.value);
												}}
											/>
											<TextInput
												label='Title'
												{...form.getInputProps('title')}
												required
												onChange={(e) => {
													form.getInputProps('title').onChange(e);
													setBookTitle(e.currentTarget.value);
												}}
											/>
										</Stack>
									</Paper>
									<Box
										pos='absolute'
										bottom={-2}
										left='50%'
										style={{ transform: 'translateX(-50%)' }}
									>
										<BookLookupModal
											isbn={isbn}
											title={bookTitle}
											onSelect={(book) => handleBookSelect(book, form)}
										/>
									</Box>
								</Box>
							</Stack>
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 'content' }}>
							<CoverImage coverUrl={coverUrl} onCoverChange={setCoverUrl} />
						</Grid.Col>
					</Grid>
					<TextInput label='Subtitle' {...form.getInputProps('subtitle')} />
					<Grid>
						<Grid.Col span={{ base: 12, md: 8 }}>
							<TextInput
								label='Publisher'
								{...form.getInputProps('publisher')}
							/>
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 4 }}>
							<NumberInput
								label='Publication Year'
								{...form.getInputProps('publicationYear')}
								min={1900}
								max={new Date().getFullYear()}
							/>
						</Grid.Col>
					</Grid>
					<Textarea
						label='Description'
						{...form.getInputProps('description')}
						autosize
						minRows={3}
						maxRows={6}
					/>
					<MultiSelect
						label='Authors'
						data={authorOptions}
						value={authorIds}
						onChange={setAuthorIds}
						searchable
					/>
					<CategoriesSelect value={categoryIds} onChange={setCategoryIds} />
				</Stack>
			)}
		</Form>
	);
}
