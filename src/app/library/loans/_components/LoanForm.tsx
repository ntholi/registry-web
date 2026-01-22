'use client';

import {
	Autocomplete,
	Group,
	Image,
	Loader,
	Paper,
	Select,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconSearch } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import FormHeader from '@/shared/ui/adease/FormHeader';
import type {
	AvailableCopy,
	BookSearchResult,
	StudentSearchResult,
} from '../_lib/types';
import {
	createLoan,
	getAvailableCopies,
	searchBooks,
} from '../_server/actions';
import StudentSearch from './StudentSearch';

export default function LoanForm() {
	const router = useRouter();
	const queryClient = useQueryClient();

	const [student, setStudent] = useState<StudentSearchResult | null>(null);
	const [book, setBook] = useState<BookSearchResult | null>(null);
	const [copy, setCopy] = useState<AvailableCopy | null>(null);
	const [dueDate, setDueDate] = useState<string | null>(null);

	const [bookSearch, setBookSearch] = useState('');
	const [debouncedBookSearch] = useDebouncedValue(bookSearch, 300);

	const { data: books = [], isLoading: booksLoading } = useQuery({
		queryKey: ['book-search', debouncedBookSearch],
		queryFn: () => searchBooks(debouncedBookSearch),
		enabled: debouncedBookSearch.length >= 2,
	});

	const { data: copies = [], isLoading: copiesLoading } = useQuery({
		queryKey: ['available-copies', book?.id],
		queryFn: () => (book ? getAvailableCopies(book.id) : Promise.resolve([])),
		enabled: !!book,
	});

	const bookOptions = books.map((b) => ({
		value: b.isbn,
		book: b,
	}));

	function handleBookSelect(value: string) {
		const selected = bookOptions.find((o) => o.value === value);
		if (selected) {
			setBook(selected.book);
			setCopy(null);
			setBookSearch('');
		}
	}

	const mutation = useMutation({
		mutationFn: async () => {
			if (!student || !copy || !dueDate) {
				throw new Error('Please fill all required fields');
			}
			return createLoan(copy.id, student.stdNo, new Date(dueDate));
		},
		onSuccess: async (loan) => {
			await queryClient.invalidateQueries({ queryKey: ['loans'] });
			notifications.show({
				title: 'Success',
				message: 'Book issued successfully',
				color: 'green',
			});
			router.push(`/library/loans/${loan.id}`);
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				mutation.mutate();
			}}
		>
			<FormHeader
				title='Issue Book'
				isLoading={mutation.isPending}
				onClose={() => router.back()}
			/>

			<Stack p='xl' gap='lg'>
				<StudentSearch onSelect={setStudent} selectedStudent={student} />

				<Paper p='md' withBorder>
					<Title order={5} mb='md'>
						Book
					</Title>
					<Stack gap='md'>
						<Autocomplete
							label='Search Book'
							placeholder='Enter ISBN or title'
							value={bookSearch}
							onChange={setBookSearch}
							onOptionSubmit={handleBookSelect}
							data={bookOptions.map((o) => o.value)}
							leftSection={
								booksLoading ? <Loader size={16} /> : <IconSearch size={16} />
							}
							filter={({ options }) => options}
							renderOption={({ option }) => {
								const foundBook = books.find((b) => b.isbn === option.value);
								return (
									<Stack gap={0}>
										<Text size='sm' fw={500}>
											{foundBook?.title}
										</Text>
										<Text size='xs' c='dimmed'>
											{foundBook?.isbn}
										</Text>
									</Stack>
								);
							}}
						/>

						{book && (
							<Group
								gap='md'
								p='sm'
								style={{
									border: '1px solid var(--mantine-color-default-border)',
									borderRadius: 'var(--mantine-radius-md)',
								}}
							>
								{book.coverUrl && (
									<Image
										src={book.coverUrl}
										alt={book.title}
										w={60}
										h={80}
										fit='contain'
										radius='sm'
									/>
								)}
								<Stack gap={2} flex={1}>
									<Text fw={500}>{book.title}</Text>
									<Text size='sm' c='dimmed'>
										ISBN: {book.isbn}
									</Text>
									<Text size='sm' c='dimmed'>
										{book.availableCopies} copies available
									</Text>
								</Stack>
							</Group>
						)}

						{book && (
							<Select
								label='Select Copy'
								placeholder={copiesLoading ? 'Loading...' : 'Select a copy'}
								data={copies.map((c) => ({
									value: String(c.id),
									label: `${c.serialNumber} - ${c.condition}${c.location ? ` (${c.location})` : ''}`,
								}))}
								value={copy ? String(copy.id) : null}
								onChange={(val) => {
									const selected = copies.find((c) => String(c.id) === val);
									setCopy(selected || null);
								}}
								disabled={copiesLoading || copies.length === 0}
							/>
						)}
					</Stack>
				</Paper>

				<DateInput
					label='Due Date'
					placeholder='Select due date'
					value={dueDate}
					onChange={setDueDate}
					minDate={tomorrow}
					firstDayOfWeek={0}
					required
				/>
			</Stack>
		</form>
	);
}
