'use client';

import {
	AspectRatio,
	Badge,
	Button,
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
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconBook, IconCalendar } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { createReservation } from '../../reservations/_server/actions';
import type { CatalogBook } from '../_server/types';

type Props = {
	book: CatalogBook;
	children: React.ReactNode;
};

export default function BookDetailModal({ book, children }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [reserveOpened, { open: openReserve, close: closeReserve }] =
		useDisclosure(false);
	const [expiryDate, setExpiryDate] = useState<string | null>(null);
	const { data: session } = useSession();
	const queryClient = useQueryClient();
	const isAvailable = book.availableCopies > 0;
	const isDashboardUser =
		session?.user?.role && ['dashboard'].includes(session.user.role);

	const reservationMutation = useMutation({
		mutationFn: async () => {
			if (!session?.user?.stdNo) {
				throw new Error('Student number not found');
			}
			if (!expiryDate) {
				throw new Error('Please select an expiry date');
			}
			return createReservation(
				book.id,
				session.user.stdNo,
				new Date(expiryDate)
			);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['reservations'] });
			notifications.show({
				title: 'Success',
				message: 'Book reserved successfully',
				color: 'green',
			});
			closeReserve();
			close();
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

					{isDashboardUser && (
						<>
							<Divider />
							<Button
								fullWidth
								leftSection={<IconCalendar size={16} />}
								onClick={openReserve}
							>
								Reserve This Book
							</Button>
						</>
					)}

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

			<Modal opened={reserveOpened} onClose={closeReserve} title='Reserve Book'>
				<Stack gap='md'>
					<Text size='sm'>
						Reserve{' '}
						<Text span fw={500}>
							{book.title}
						</Text>{' '}
						for yourself?
					</Text>

					<DateInput
						label='Expiry Date'
						placeholder='Select expiry date'
						value={expiryDate}
						onChange={setExpiryDate}
						minDate={tomorrow}
						firstDayOfWeek={0}
						required
					/>

					<Button
						fullWidth
						loading={reservationMutation.isPending}
						onClick={() => reservationMutation.mutate()}
						disabled={!expiryDate}
					>
						Confirm Reservation
					</Button>
				</Stack>
			</Modal>
		</>
	);
}
