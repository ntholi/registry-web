'use client';

import { books } from '@library/_database';
import {
	Group,
	Image,
	Loader,
	MultiSelect,
	NumberInput,
	Stack,
	TextInput,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { Form } from '@/shared/ui/adease';
import { getAllAuthors } from '../../authors/_server/actions';
import { getAllCategories } from '../../categories/_server/actions';
import type { BookWithRelations } from '../_lib/types';
import { fetchBookCover } from '../_server/actions';

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
	const [coverUrl, setCoverUrl] = useState(defaultValues?.coverUrl ?? '');
	const [loadingCover, setLoadingCover] = useState(false);
	const [authorIds, setAuthorIds] = useState<string[]>(
		defaultValues?.bookAuthors?.map((ba) => String(ba.authorId)) ?? []
	);
	const [categoryIds, setCategoryIds] = useState<string[]>(
		defaultValues?.bookCategories?.map((bc) => String(bc.categoryId)) ?? []
	);

	const { data: authorsData } = useQuery({
		queryKey: ['authors', 'all'],
		queryFn: getAllAuthors,
	});

	const { data: categoriesData } = useQuery({
		queryKey: ['categories', 'all'],
		queryFn: getAllCategories,
	});

	async function handleIsbnBlur(isbn: string) {
		if (!isbn || isbn.length < 10) return;
		setLoadingCover(true);
		const url = await fetchBookCover(isbn);
		if (url) setCoverUrl(url);
		setLoadingCover(false);
	}

	const authorOptions =
		authorsData?.map((a) => ({ value: String(a.id), label: a.name })) ?? [];
	const categoryOptions =
		categoriesData?.map((c) => ({ value: String(c.id), label: c.name })) ?? [];

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
				<Group align='flex-start'>
					<Stack flex={1}>
						<TextInput
							label='ISBN'
							{...form.getInputProps('isbn')}
							required
							onBlur={(e) => handleIsbnBlur(e.currentTarget.value)}
							rightSection={loadingCover && <Loader size='xs' />}
						/>
						<TextInput
							label='Title'
							{...form.getInputProps('title')}
							required
						/>
						<TextInput label='Publisher' {...form.getInputProps('publisher')} />
						<NumberInput
							label='Publication Year'
							{...form.getInputProps('publicationYear')}
							min={1900}
							max={new Date().getFullYear()}
						/>
						<TextInput label='Edition' {...form.getInputProps('edition')} />
						<MultiSelect
							label='Authors'
							data={authorOptions}
							value={authorIds}
							onChange={setAuthorIds}
							searchable
						/>
						<MultiSelect
							label='Categories'
							data={categoryOptions}
							value={categoryIds}
							onChange={setCategoryIds}
							searchable
						/>
					</Stack>
					{coverUrl && (
						<Image
							src={coverUrl}
							alt='Book cover'
							w={150}
							h={200}
							fit='contain'
							radius='md'
						/>
					)}
				</Group>
			)}
		</Form>
	);
}
