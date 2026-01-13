# Step 004: Books Feature (CRUD)

## Introduction

This step implements the complete Books feature including CRUD operations for Books, Authors, Categories, and Book Copies. This follows the create-feature skill pattern with Repository → Service → Actions architecture.

**Previous Steps Completed:**
- ✅ Step 001: Core database schema (books, authors, categories)
- ✅ Step 002: Digital resources and external libraries schema
- ✅ Step 003: Loans and fines schema

**Database tables available:** `books`, `bookCopies`, `authors`, `categories`, `bookAuthors`, `bookCategories`

---

## File Structure

```
src/app/library/
├── layout.tsx
├── library.config.ts
├── _lib/
│   └── google-books.ts
├── books/
│   ├── _server/
│   │   ├── repository.ts
│   │   ├── service.ts
│   │   └── actions.ts
│   ├── _components/
│   │   └── Form.tsx
│   ├── _lib/
│   │   └── types.ts
│   ├── layout.tsx
│   ├── page.tsx
│   ├── new/
│   │   └── page.tsx
│   ├── [id]/
│   │   ├── page.tsx
│   │   ├── edit/
│   │   │   └── page.tsx
│   │   └── copies/
│   │       ├── page.tsx
│   │       └── new/
│   │           └── page.tsx
│   └── index.ts
├── book-copies/
│   ├── _server/
│   │   ├── repository.ts
│   │   ├── service.ts
│   │   └── actions.ts
│   ├── _components/
│   │   └── Form.tsx
│   ├── _lib/
│   │   └── types.ts
│   └── [id]/
│       ├── page.tsx
│       └── edit/
│           └── page.tsx
├── authors/
│   ├── _server/
│   │   ├── repository.ts
│   │   ├── service.ts
│   │   └── actions.ts
│   ├── _components/
│   │   └── Form.tsx
│   ├── _lib/
│   │   └── types.ts
│   ├── layout.tsx
│   ├── page.tsx
│   ├── new/
│   │   └── page.tsx
│   ├── [id]/
│   │   ├── page.tsx
│   │   └── edit/
│   │       └── page.tsx
│   └── index.ts
├── categories/
│   ├── _server/
│   │   ├── repository.ts
│   │   ├── service.ts
│   │   └── actions.ts
│   ├── _components/
│   │   └── Form.tsx
│   ├── _lib/
│   │   └── types.ts
│   ├── layout.tsx
│   ├── page.tsx
│   ├── new/
│   │   └── page.tsx
│   ├── [id]/
│   │   ├── page.tsx
│   │   └── edit/
│   │       └── page.tsx
│   └── index.ts
└── _database/
```

---

## Module Configuration

### `src/app/library/library.config.ts`

```typescript
import { IconBook2, IconCategory, IconTags, IconUsers } from '@tabler/icons-react';

export const libraryConfig = {
	title: 'Library',
	path: '/library',
	navItems: [
		{ label: 'Books', href: '/library/books', icon: IconBook2 },
		{ label: 'Authors', href: '/library/authors', icon: IconUsers },
		{ label: 'Categories', href: '/library/categories', icon: IconTags },
	],
};
```

### `src/app/library/layout.tsx`

```typescript
import type { PropsWithChildren } from 'react';

export default function LibraryLayout({ children }: PropsWithChildren) {
	return children;
}
```

---

## Google Books API Utility

### `src/app/library/_lib/google-books.ts`

```typescript
type GoogleBooksResponse = {
	items?: Array<{
		volumeInfo: {
			imageLinks?: {
				thumbnail?: string;
				smallThumbnail?: string;
			};
		};
	}>;
};

export async function fetchBookCoverByIsbn(
	isbn: string
): Promise<string | null> {
	try {
		const response = await fetch(
			`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
		);
		if (!response.ok) return null;

		const data: GoogleBooksResponse = await response.json();
		const imageLinks = data.items?.[0]?.volumeInfo?.imageLinks;

		return imageLinks?.thumbnail ?? imageLinks?.smallThumbnail ?? null;
	} catch {
		return null;
	}
}
```

---

## Feature: Authors

### `src/app/library/authors/_lib/types.ts`

```typescript
import type { authors } from '@library/_database';

export type Author = typeof authors.$inferSelect;
export type AuthorInsert = typeof authors.$inferInsert;
```

### `src/app/library/authors/_server/repository.ts`

```typescript
import { authors } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class AuthorRepository extends BaseRepository<
	typeof authors,
	'id'
> {
	constructor() {
		super(authors, authors.id);
	}
}
```

### `src/app/library/authors/_server/service.ts`

```typescript
import type { authors } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import AuthorRepository from './repository';

class AuthorService extends BaseService<typeof authors, 'id'> {
	constructor() {
		super(new AuthorRepository(), {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
			createRoles: ['dashboard'],
			updateRoles: ['dashboard'],
			deleteRoles: ['dashboard'],
		});
	}
}

export const authorsService = serviceWrapper(AuthorService, 'AuthorService');
```

### `src/app/library/authors/_server/actions.ts`

```typescript
'use server';

import type { authors } from '@/core/database';
import { authorsService } from './service';

type Author = typeof authors.$inferInsert;

export async function getAuthor(id: number) {
	return authorsService.get(id);
}

export async function getAuthors(page = 1, search = '') {
	return authorsService.findAll({
		page,
		search,
		searchColumns: ['name'],
		sort: [{ column: 'name', order: 'asc' }],
	});
}

export async function getAllAuthors() {
	const result = await authorsService.findAll({ pageSize: 1000 });
	return result.data;
}

export async function createAuthor(data: Author) {
	return authorsService.create(data);
}

export async function updateAuthor(id: number, data: Author) {
	return authorsService.update(id, data);
}

export async function deleteAuthor(id: number) {
	return authorsService.delete(id);
}
```

### `src/app/library/authors/_components/Form.tsx`

```typescript
'use client';

import { authors } from '@library/_database';
import { TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { Form } from '@/shared/ui/adease';

type Author = typeof authors.$inferInsert;

type Props = {
	onSubmit: (values: Author) => Promise<Author>;
	defaultValues?: Author;
	title?: string;
};

export default function AuthorForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['authors']}
			schema={createInsertSchema(authors)}
			defaultValues={defaultValues}
			onSuccess={({ id }) => router.push(`/library/authors/${id}`)}
		>
			{(form) => (
				<TextInput label='Name' {...form.getInputProps('name')} required />
			)}
		</Form>
	);
}
```

### `src/app/library/authors/layout.tsx`

```typescript
'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { getAuthors } from './_server/actions';

export default function AuthorsLayout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path='/library/authors'
			queryKey={['authors']}
			getData={getAuthors}
			actionIcons={[<NewLink key='new' href='/library/authors/new' />]}
			renderItem={(it) => <ListItem id={it.id} label={it.name} />}
		>
			{children}
		</ListLayout>
	);
}
```

### `src/app/library/authors/page.tsx`

```typescript
import { NothingSelected } from '@/shared/ui/adease';

export default function AuthorsPage() {
	return <NothingSelected title='Authors' />;
}
```

### `src/app/library/authors/new/page.tsx`

```typescript
import { Box } from '@mantine/core';
import Form from '../_components/Form';
import { createAuthor } from '../_server/actions';

export default function NewAuthorPage() {
	return (
		<Box p='lg'>
			<Form title='Create Author' onSubmit={createAuthor} />
		</Box>
	);
}
```

### `src/app/library/authors/[id]/page.tsx`

```typescript
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import { deleteAuthor, getAuthor } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function AuthorDetailsPage({ params }: Props) {
	const { id } = await params;
	const item = await getAuthor(Number(id));

	if (!item) return notFound();

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Author'
				queryKey={['authors']}
				handleDelete={async () => {
					'use server';
					await deleteAuthor(Number(id));
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Name'>{item.name}</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
```

### `src/app/library/authors/[id]/edit/page.tsx`

```typescript
import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../_components/Form';
import { getAuthor, updateAuthor } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditAuthorPage({ params }: Props) {
	const { id } = await params;
	const item = await getAuthor(Number(id));

	if (!item) return notFound();

	return (
		<Box p='lg'>
			<Form
				title='Edit Author'
				defaultValues={item}
				onSubmit={async (value) => {
					'use server';
					return updateAuthor(Number(id), value);
				}}
			/>
		</Box>
	);
}
```

### `src/app/library/authors/index.ts`

```typescript
export { default as AuthorForm } from './_components/Form';
export * from './_lib/types';
export * from './_server/actions';
```

---

## Feature: Categories

### `src/app/library/categories/_lib/types.ts`

```typescript
import type { categories } from '@library/_database';

export type Category = typeof categories.$inferSelect;
export type CategoryInsert = typeof categories.$inferInsert;
```

### `src/app/library/categories/_server/repository.ts`

```typescript
import { categories } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class CategoryRepository extends BaseRepository<
	typeof categories,
	'id'
> {
	constructor() {
		super(categories, categories.id);
	}
}
```

### `src/app/library/categories/_server/service.ts`

```typescript
import type { categories } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import CategoryRepository from './repository';

class CategoryService extends BaseService<typeof categories, 'id'> {
	constructor() {
		super(new CategoryRepository(), {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
			createRoles: ['dashboard'],
			updateRoles: ['dashboard'],
			deleteRoles: ['dashboard'],
		});
	}
}

export const categoriesService = serviceWrapper(
	CategoryService,
	'CategoryService'
);
```

### `src/app/library/categories/_server/actions.ts`

```typescript
'use server';

import type { categories } from '@/core/database';
import { categoriesService } from './service';

type Category = typeof categories.$inferInsert;

export async function getCategory(id: number) {
	return categoriesService.get(id);
}

export async function getCategories(page = 1, search = '') {
	return categoriesService.findAll({
		page,
		search,
		searchColumns: ['name'],
		sort: [{ column: 'name', order: 'asc' }],
	});
}

export async function getAllCategories() {
	const result = await categoriesService.findAll({ pageSize: 1000 });
	return result.data;
}

export async function createCategory(data: Category) {
	return categoriesService.create(data);
}

export async function updateCategory(id: number, data: Category) {
	return categoriesService.update(id, data);
}

export async function deleteCategory(id: number) {
	return categoriesService.delete(id);
}
```

### `src/app/library/categories/_components/Form.tsx`

```typescript
'use client';

import { categories } from '@library/_database';
import { TextInput, Textarea } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { Form } from '@/shared/ui/adease';

type Category = typeof categories.$inferInsert;

type Props = {
	onSubmit: (values: Category) => Promise<Category>;
	defaultValues?: Category;
	title?: string;
};

export default function CategoryForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['categories']}
			schema={createInsertSchema(categories)}
			defaultValues={defaultValues}
			onSuccess={({ id }) => router.push(`/library/categories/${id}`)}
		>
			{(form) => (
				<>
					<TextInput label='Name' {...form.getInputProps('name')} required />
					<Textarea label='Description' {...form.getInputProps('description')} />
				</>
			)}
		</Form>
	);
}
```

### `src/app/library/categories/layout.tsx`

```typescript
'use client';

import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { getCategories } from './_server/actions';

export default function CategoriesLayout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path='/library/categories'
			queryKey={['categories']}
			getData={getCategories}
			actionIcons={[<NewLink key='new' href='/library/categories/new' />]}
			renderItem={(it) => (
				<ListItem id={it.id} label={it.name} description={it.description} />
			)}
		>
			{children}
		</ListLayout>
	);
}
```

### `src/app/library/categories/page.tsx`

```typescript
import { NothingSelected } from '@/shared/ui/adease';

export default function CategoriesPage() {
	return <NothingSelected title='Categories' />;
}
```

### `src/app/library/categories/new/page.tsx`

```typescript
import { Box } from '@mantine/core';
import Form from '../_components/Form';
import { createCategory } from '../_server/actions';

export default function NewCategoryPage() {
	return (
		<Box p='lg'>
			<Form title='Create Category' onSubmit={createCategory} />
		</Box>
	);
}
```

### `src/app/library/categories/[id]/page.tsx`

```typescript
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import { deleteCategory, getCategory } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function CategoryDetailsPage({ params }: Props) {
	const { id } = await params;
	const item = await getCategory(Number(id));

	if (!item) return notFound();

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Category'
				queryKey={['categories']}
				handleDelete={async () => {
					'use server';
					await deleteCategory(Number(id));
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Name'>{item.name}</FieldView>
				<FieldView label='Description'>{item.description}</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
```

### `src/app/library/categories/[id]/edit/page.tsx`

```typescript
import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../_components/Form';
import { getCategory, updateCategory } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditCategoryPage({ params }: Props) {
	const { id } = await params;
	const item = await getCategory(Number(id));

	if (!item) return notFound();

	return (
		<Box p='lg'>
			<Form
				title='Edit Category'
				defaultValues={item}
				onSubmit={async (value) => {
					'use server';
					return updateCategory(Number(id), value);
				}}
			/>
		</Box>
	);
}
```

### `src/app/library/categories/index.ts`

```typescript
export { default as CategoryForm } from './_components/Form';
export * from './_lib/types';
export * from './_server/actions';
```

---

## Feature: Books

### `src/app/library/books/_lib/types.ts`

```typescript
import type { bookAuthors, bookCategories, books, bookCopies } from '@library/_database';

export type Book = typeof books.$inferSelect;
export type BookInsert = typeof books.$inferInsert;

export type BookWithRelations = Book & {
	bookAuthors: Array<{ authorId: number; author: { id: number; name: string } }>;
	bookCategories: Array<{ categoryId: number; category: { id: number; name: string } }>;
	bookCopies: Array<typeof bookCopies.$inferSelect>;
	availableCopies: number;
	totalCopies: number;
};
```

### `src/app/library/books/_server/repository.ts`

```typescript
import {
	authors,
	bookAuthors,
	bookCategories,
	bookCopies,
	books,
	categories,
	db,
} from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';
import { and, count, eq, ne } from 'drizzle-orm';

export default class BookRepository extends BaseRepository<typeof books, 'id'> {
	constructor() {
		super(books, books.id);
	}

	async findByIdWithRelations(id: number) {
		const book = await db.query.books.findFirst({
			where: eq(books.id, id),
			with: {
				bookAuthors: {
					with: { author: true },
				},
				bookCategories: {
					with: { category: true },
				},
				bookCopies: true,
			},
		});

		if (!book) return null;

		const availableCopies = book.bookCopies.filter(
			(c) => c.status === 'Available'
		).length;
		const totalCopies = book.bookCopies.filter(
			(c) => c.status !== 'Withdrawn'
		).length;

		return { ...book, availableCopies, totalCopies };
	}

	async findByIsbn(isbn: string) {
		return db.query.books.findFirst({
			where: eq(books.isbn, isbn),
		});
	}

	async createWithRelations(
		book: typeof books.$inferInsert,
		authorIds: number[],
		categoryIds: number[]
	) {
		return db.transaction(async (tx) => {
			const [newBook] = await tx.insert(books).values(book).returning();

			if (authorIds.length > 0) {
				await tx.insert(bookAuthors).values(
					authorIds.map((authorId) => ({
						bookId: newBook.id,
						authorId,
					}))
				);
			}

			if (categoryIds.length > 0) {
				await tx.insert(bookCategories).values(
					categoryIds.map((categoryId) => ({
						bookId: newBook.id,
						categoryId,
					}))
				);
			}

			return newBook;
		});
	}

	async updateWithRelations(
		id: number,
		book: Partial<typeof books.$inferInsert>,
		authorIds: number[],
		categoryIds: number[]
	) {
		return db.transaction(async (tx) => {
			const [updated] = await tx
				.update(books)
				.set(book)
				.where(eq(books.id, id))
				.returning();

			await tx.delete(bookAuthors).where(eq(bookAuthors.bookId, id));
			await tx.delete(bookCategories).where(eq(bookCategories.bookId, id));

			if (authorIds.length > 0) {
				await tx.insert(bookAuthors).values(
					authorIds.map((authorId) => ({
						bookId: id,
						authorId,
					}))
				);
			}

			if (categoryIds.length > 0) {
				await tx.insert(bookCategories).values(
					categoryIds.map((categoryId) => ({
						bookId: id,
						categoryId,
					}))
				);
			}

			return updated;
		});
	}
}
```

### `src/app/library/books/_server/service.ts`

```typescript
import type { books } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import BookRepository from './repository';

class BookService extends BaseService<typeof books, 'id'> {
	declare repository: BookRepository;

	constructor() {
		super(new BookRepository(), {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
			createRoles: ['dashboard'],
			updateRoles: ['dashboard'],
			deleteRoles: ['dashboard'],
		});
	}

	async getWithRelations(id: number) {
		return this.repository.findByIdWithRelations(id);
	}

	async findByIsbn(isbn: string) {
		return this.repository.findByIsbn(isbn);
	}

	async createWithRelations(
		book: typeof books.$inferInsert,
		authorIds: number[],
		categoryIds: number[]
	) {
		return this.repository.createWithRelations(book, authorIds, categoryIds);
	}

	async updateWithRelations(
		id: number,
		book: Partial<typeof books.$inferInsert>,
		authorIds: number[],
		categoryIds: number[]
	) {
		return this.repository.updateWithRelations(
			id,
			book,
			authorIds,
			categoryIds
		);
	}
}

export const booksService = serviceWrapper(BookService, 'BookService');
```

### `src/app/library/books/_server/actions.ts`

```typescript
'use server';

import type { books } from '@/core/database';
import { fetchBookCoverByIsbn } from '../../_lib/google-books';
import { booksService } from './service';

type Book = typeof books.$inferInsert;

export async function getBook(id: number) {
	return booksService.getWithRelations(id);
}

export async function getBooks(page = 1, search = '') {
	return booksService.findAll({
		page,
		search,
		searchColumns: ['title', 'isbn'],
		sort: [{ column: 'title', order: 'asc' }],
	});
}

export async function createBook(
	book: Book,
	authorIds: number[],
	categoryIds: number[]
) {
	return booksService.createWithRelations(book, authorIds, categoryIds);
}

export async function updateBook(
	id: number,
	book: Book,
	authorIds: number[],
	categoryIds: number[]
) {
	return booksService.updateWithRelations(id, book, authorIds, categoryIds);
}

export async function deleteBook(id: number) {
	return booksService.delete(id);
}

export async function fetchBookCover(isbn: string) {
	return fetchBookCoverByIsbn(isbn);
}
```

### `src/app/library/books/_components/Form.tsx`

```typescript
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
import { fetchBookCover } from '../_server/actions';
import type { BookWithRelations } from '../_lib/types';

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
					{ ...values, coverUrl },
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
						<TextInput label='Title' {...form.getInputProps('title')} required />
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
```

### `src/app/library/books/layout.tsx`

```typescript
'use client';

import { Badge, Group } from '@mantine/core';
import type { PropsWithChildren } from 'react';
import { ListItem, ListLayout, NewLink } from '@/shared/ui/adease';
import { getBooks } from './_server/actions';

export default function BooksLayout({ children }: PropsWithChildren) {
	return (
		<ListLayout
			path='/library/books'
			queryKey={['books']}
			getData={getBooks}
			actionIcons={[<NewLink key='new' href='/library/books/new' />]}
			renderItem={(it) => (
				<ListItem
					id={it.id}
					label={it.isbn}
					description={it.title}
				/>
			)}
		>
			{children}
		</ListLayout>
	);
}
```

### `src/app/library/books/page.tsx`

```typescript
import { NothingSelected } from '@/shared/ui/adease';

export default function BooksPage() {
	return <NothingSelected title='Books' />;
}
```

### `src/app/library/books/new/page.tsx`

```typescript
import { Box } from '@mantine/core';
import Form from '../_components/Form';
import { createBook } from '../_server/actions';

export default function NewBookPage() {
	return (
		<Box p='lg'>
			<Form title='Create Book' onSubmit={createBook} />
		</Box>
	);
}
```

### `src/app/library/books/[id]/page.tsx`

```typescript
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
						<FieldView label='Publication Year'>{book.publicationYear}</FieldView>
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
```

### `src/app/library/books/[id]/edit/page.tsx`

```typescript
import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../_components/Form';
import { getBook, updateBook } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditBookPage({ params }: Props) {
	const { id } = await params;
	const book = await getBook(Number(id));

	if (!book) return notFound();

	return (
		<Box p='lg'>
			<Form
				title='Edit Book'
				defaultValues={book}
				onSubmit={async (value, authorIds, categoryIds) => {
					'use server';
					return updateBook(Number(id), value, authorIds, categoryIds);
				}}
			/>
		</Box>
	);
}
```

### `src/app/library/books/index.ts`

```typescript
export { default as BookForm } from './_components/Form';
export * from './_lib/types';
export * from './_server/actions';
```

---

## Feature: Book Copies

### `src/app/library/book-copies/_lib/types.ts`

```typescript
import type { bookCopies, books } from '@library/_database';

export type BookCopy = typeof bookCopies.$inferSelect;
export type BookCopyInsert = typeof bookCopies.$inferInsert;

export type BookCopyWithBook = BookCopy & {
	book: typeof books.$inferSelect;
};
```

### `src/app/library/book-copies/_server/repository.ts`

```typescript
import { bookCopies, books, db } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';
import { and, eq } from 'drizzle-orm';

export default class BookCopyRepository extends BaseRepository<
	typeof bookCopies,
	'id'
> {
	constructor() {
		super(bookCopies, bookCopies.id);
	}

	async findByIdWithBook(id: number) {
		return db.query.bookCopies.findFirst({
			where: eq(bookCopies.id, id),
			with: { book: true },
		});
	}

	async findByBookId(bookId: number) {
		return db.query.bookCopies.findMany({
			where: eq(bookCopies.bookId, bookId),
			orderBy: bookCopies.serialNumber,
		});
	}

	async findBySerialNumber(serialNumber: string) {
		return db.query.bookCopies.findFirst({
			where: eq(bookCopies.serialNumber, serialNumber),
			with: { book: true },
		});
	}

	async updateStatus(id: number, status: 'Available' | 'OnLoan' | 'Withdrawn') {
		const [updated] = await db
			.update(bookCopies)
			.set({ status })
			.where(eq(bookCopies.id, id))
			.returning();
		return updated;
	}
}
```

### `src/app/library/book-copies/_server/service.ts`

```typescript
import type { bookCopies } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import BookCopyRepository from './repository';

class BookCopyService extends BaseService<typeof bookCopies, 'id'> {
	declare repository: BookCopyRepository;

	constructor() {
		super(new BookCopyRepository(), {
			byIdRoles: ['dashboard'],
			findAllRoles: ['dashboard'],
			createRoles: ['dashboard'],
			updateRoles: ['dashboard'],
			deleteRoles: ['dashboard'],
		});
	}

	async getWithBook(id: number) {
		return this.repository.findByIdWithBook(id);
	}

	async findByBookId(bookId: number) {
		return this.repository.findByBookId(bookId);
	}

	async findBySerialNumber(serialNumber: string) {
		return this.repository.findBySerialNumber(serialNumber);
	}

	async withdraw(id: number) {
		return this.repository.updateStatus(id, 'Withdrawn');
	}
}

export const bookCopiesService = serviceWrapper(
	BookCopyService,
	'BookCopyService'
);
```

### `src/app/library/book-copies/_server/actions.ts`

```typescript
'use server';

import type { bookCopies } from '@/core/database';
import { bookCopiesService } from './service';

type BookCopy = typeof bookCopies.$inferInsert;

export async function getBookCopy(id: number) {
	return bookCopiesService.getWithBook(id);
}

export async function getBookCopies(bookId: number) {
	return bookCopiesService.findByBookId(bookId);
}

export async function getBookCopyBySerial(serialNumber: string) {
	return bookCopiesService.findBySerialNumber(serialNumber);
}

export async function createBookCopy(data: BookCopy) {
	return bookCopiesService.create(data);
}

export async function updateBookCopy(id: number, data: BookCopy) {
	return bookCopiesService.update(id, data);
}

export async function withdrawBookCopy(id: number) {
	return bookCopiesService.withdraw(id);
}
```

### `src/app/library/book-copies/_components/Form.tsx`

```typescript
'use client';

import { bookCopies, bookCondition } from '@library/_database';
import { Select, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { Form } from '@/shared/ui/adease';

type BookCopy = typeof bookCopies.$inferInsert;

type Props = {
	bookId: number;
	onSubmit: (values: BookCopy) => Promise<BookCopy>;
	defaultValues?: BookCopy;
	title?: string;
	returnPath: string;
};

export default function BookCopyForm({
	bookId,
	onSubmit,
	defaultValues,
	title,
	returnPath,
}: Props) {
	const router = useRouter();
	const conditionOptions = bookCondition.enumValues.map((v) => ({
		value: v,
		label: v,
	}));

	return (
		<Form
			title={title}
			action={async (values) => onSubmit({ ...values, bookId })}
			queryKey={['book-copies', bookId]}
			schema={createInsertSchema(bookCopies).omit({ bookId: true })}
			defaultValues={defaultValues}
			onSuccess={() => router.push(returnPath)}
		>
			{(form) => (
				<>
					<TextInput
						label='Serial Number'
						{...form.getInputProps('serialNumber')}
						required
					/>
					<Select
						label='Condition'
						data={conditionOptions}
						{...form.getInputProps('condition')}
					/>
					<TextInput label='Location' {...form.getInputProps('location')} />
					<DateInput label='Acquired Date' {...form.getInputProps('acquiredAt')} />
				</>
			)}
		</Form>
	);
}
```

### `src/app/library/books/[id]/copies/page.tsx`

```typescript
import { Badge, Button, Group, Stack, Table, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBook } from '../../_server/actions';
import { getBookCopies } from '@library/book-copies/_server/actions';
import { getConditionColor, getBookCopyStatusColor } from '@/shared/lib/utils/colors';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function BookCopiesPage({ params }: Props) {
	const { id } = await params;
	const book = await getBook(Number(id));

	if (!book) return notFound();

	const copies = await getBookCopies(Number(id));

	return (
		<Stack p='lg'>
			<Group justify='space-between'>
				<Text fw={500} size='lg'>
					Copies of "{book.title}"
				</Text>
				<Button
					component={Link}
					href={`/library/books/${id}/copies/new`}
					leftSection={<IconPlus size={16} />}
					size='sm'
				>
					Add Copy
				</Button>
			</Group>
			<Table striped highlightOnHover>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Serial Number</Table.Th>
						<Table.Th>Condition</Table.Th>
						<Table.Th>Status</Table.Th>
						<Table.Th>Location</Table.Th>
						<Table.Th>Actions</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{copies.map((copy) => (
						<Table.Tr key={copy.id}>
							<Table.Td>{copy.serialNumber}</Table.Td>
							<Table.Td>
								<Badge color={getConditionColor(copy.condition)}>
									{copy.condition}
								</Badge>
							</Table.Td>
							<Table.Td>
								<Badge color={getBookCopyStatusColor(copy.status)}>{copy.status}</Badge>
							</Table.Td>
							<Table.Td>{copy.location}</Table.Td>
							<Table.Td>
								<Button
									component={Link}
									href={`/library/book-copies/${copy.id}`}
									size='xs'
									variant='subtle'
								>
									View
								</Button>
							</Table.Td>
						</Table.Tr>
					))}
				</Table.Tbody>
			</Table>
		</Stack>
	);
}
```

### `src/app/library/books/[id]/copies/new/page.tsx`

```typescript
import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { getBook } from '../../../_server/actions';
import { createBookCopy } from '@library/book-copies/_server/actions';
import BookCopyForm from '@library/book-copies/_components/Form';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function NewBookCopyPage({ params }: Props) {
	const { id } = await params;
	const book = await getBook(Number(id));

	if (!book) return notFound();

	return (
		<Box p='lg'>
			<BookCopyForm
				bookId={Number(id)}
				title={`Add Copy - ${book.title}`}
				onSubmit={createBookCopy}
				returnPath={`/library/books/${id}/copies`}
			/>
		</Box>
	);
}
```

### `src/app/library/book-copies/[id]/page.tsx`

```typescript
import { Badge } from '@mantine/core';
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import { formatDate } from '@/shared/lib/utils/dates';
import { getConditionColor, getBookCopyStatusColor } from '@/shared/lib/utils/colors';
import { getBookCopy, withdrawBookCopy } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function BookCopyDetailsPage({ params }: Props) {
	const { id } = await params;
	const copy = await getBookCopy(Number(id));

	if (!copy) return notFound();

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Book Copy'
				queryKey={['book-copies']}
				handleDelete={
					copy.status === 'Available'
						? async () => {
								'use server';
								await withdrawBookCopy(Number(id));
							}
						: undefined
				}
				deleteLabel='Withdraw'
			/>
			<DetailsViewBody>
				<FieldView label='Book'>{copy.book.title}</FieldView>
				<FieldView label='Serial Number'>{copy.serialNumber}</FieldView>
				<FieldView label='Condition'>
					<Badge color={getConditionColor(copy.condition)}>
						{copy.condition}
					</Badge>
				</FieldView>
				<FieldView label='Status'>
					<Badge color={getBookCopyStatusColor(copy.status)}>{copy.status}</Badge>
				</FieldView>
				<FieldView label='Location'>{copy.location}</FieldView>
				<FieldView label='Acquired Date'>
					{copy.acquiredAt && formatDate(copy.acquiredAt)}
				</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
```

### `src/app/library/book-copies/[id]/edit/page.tsx`

```typescript
import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import Form from '../../_components/Form';
import { getBookCopy, updateBookCopy } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditBookCopyPage({ params }: Props) {
	const { id } = await params;
	const copy = await getBookCopy(Number(id));

	if (!copy) return notFound();

	return (
		<Box p='lg'>
			<Form
				bookId={copy.bookId}
				title='Edit Book Copy'
				defaultValues={copy}
				returnPath={`/library/book-copies/${id}`}
				onSubmit={async (value) => {
					'use server';
					return updateBookCopy(Number(id), value);
				}}
			/>
		</Box>
	);
}
```

---

## Validation Criteria

After implementation:
1. `pnpm tsc --noEmit` - no type errors
2. `pnpm lint:fix` - no lint errors
3. Can create, view, edit, delete books
4. Can associate multiple authors and categories to a book
5. ISBN auto-fetches cover image from Google Books
6. Can create, view, edit, delete authors
7. Can create, view, edit, delete categories
8. Can add, view, edit, withdraw book copies
9. Book details show computed available/total copies counts
10. Search works on all list views
