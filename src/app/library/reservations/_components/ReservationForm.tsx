'use client';

import {
	Autocomplete,
	Group,
	Image,
	Loader,
	Paper,
	Stack,
	Text,
	Textarea,
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
import {
	createReservation,
	searchBooks,
} from '../_server/actions';
import StudentSearch from './StudentSearch';

type BookSearchResult = {
	id: string;
	isbn: string;
	title: string;
	coverUrl: string | null;
};

type StudentSearchResult = {
	stdNo: number;
	name: string;
	activeReservationsCount: number;
};

export default function ReservationForm() {
	const router = useRouter();
	const queryClient = useQueryClient();

	const [student, setStudent] = useState<StudentSearchResult | null>(null);
	const [book, setBook] = useState<BookSearchResult | null>(null);
	const [expiryDate, setExpiryDate] = useState<string | null>(null);
	const [notes, setNotes] = useState('');

	const [bookSearch, setBookSearch] = useState('');
	const [debouncedBookSearch] = useDebouncedValue(bookSearch, 300);

	const { data: books = [], isLoading: booksLoading } = useQuery({
		queryKey: ['book-search', debouncedBookSearch],
		queryFn: () => searchBooks(debouncedBookSearch),
		enabled: debouncedBookSearch.length >= 2,
	});

	const bookOptions = books.map((b) => ({
		value: b.isbn,
		book: b,
	}));

	function handleBookSelect(value: string) {
		const selected = bookOptions.find((o) => o.value === value);
		if (selected) {
			setBook(selected.book);
			setBookSearch('');
		}
	}

	const mutation = useMutation({
		mutationFn: async () => {
			if (!student || !book || !expiryDate) {
				throw new Error('Please fill all required fields');
			}
			return createReservation(book.id, student.stdNo, new Date(expiryDate), notes);
		},
		onSuccess: async (reservation) => {
			await queryClient.invalidateQueries({ queryKey: ['reservations'] });
			await queryClient.invalidateQueries({ queryKey: ['book-search'] });
			notifications.show({
				title: 'Success',
				message: 'Book reserved successfully',
				color: 'green',
			});
			router.push(`/library/reservations/${reservation.id}`);
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
				title='Reserve Book'
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
								</Stack>
							</Group>
						)}
					</Stack>
				</Paper>

				<DateInput
					label='Expiry Date'
					placeholder='Select expiry date'
					value={expiryDate}
					onChange={setExpiryDate}
					minDate={tomorrow}
					firstDayOfWeek={0}
					required
				/>

				<Textarea
					label='Notes'
					placeholder='Optional notes about this reservation'
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					rows={3}
				/>
			</Stack>
		</form>
	);
}
