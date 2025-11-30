'use client';

import {
	Box,
	Divider,
	Group,
	Paper,
	Skeleton,
	Stack,
	Text,
} from '@mantine/core';
import { Calendar } from '@mantine/dates';
import { IconCalendarEvent } from '@tabler/icons-react';
import dayjs from 'dayjs';

type AssignmentDueDate = {
	id: number;
	name: string;
	duedate: number;
};

type DashboardCalendarProps = {
	assignments: AssignmentDueDate[] | undefined;
	isLoading: boolean;
};

export default function DashboardCalendar({
	assignments,
	isLoading,
}: DashboardCalendarProps) {
	const dueDates = assignments?.map((a) => dayjs(a.duedate * 1000)) ?? [];

	return (
		<Paper withBorder p='lg' radius='md' h='fit-content'>
			<Group mb='lg' gap='xs'>
				<IconCalendarEvent size={22} stroke={1.5} />
				<Text fw={600} size='lg'>
					Calendar
				</Text>
			</Group>

			{isLoading ? (
				<Stack align='center' py='xl'>
					<Skeleton height={280} width='100%' radius='md' />
				</Stack>
			) : (
				<Box
					style={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
					}}
				>
					<Calendar
						static
						size='md'
						firstDayOfWeek={0}
						styles={{
							calendarHeader: {
								maxWidth: '100%',
								marginBottom: 'var(--mantine-spacing-md)',
							},
							calendarHeaderLevel: {
								fontSize: 'var(--mantine-font-size-md)',
								fontWeight: 600,
							},
							monthCell: {
								textAlign: 'center',
							},
							day: {
								fontSize: 'var(--mantine-font-size-sm)',
								fontWeight: 500,
								height: '36px',
								width: '36px',
							},
						}}
						getDayProps={(date) => {
							const hasAssignment = dueDates.some((d) =>
								dayjs(date).isSame(d, 'day')
							);
							const isPast = dayjs(date).isBefore(dayjs(), 'day');
							const isToday = dayjs(date).isSame(dayjs(), 'day');

							if (hasAssignment) {
								return {
									style: {
										backgroundColor: isPast
											? 'light-dark(var(--mantine-color-red-1), var(--mantine-color-red-9))'
											: 'light-dark(var(--mantine-color-blue-1), var(--mantine-color-blue-9))',
										color: isPast
											? 'light-dark(var(--mantine-color-red-7), var(--mantine-color-red-2))'
											: 'light-dark(var(--mantine-color-blue-7), var(--mantine-color-blue-2))',
										borderRadius: 'var(--mantine-radius-sm)',
										fontWeight: 600,
									},
								};
							}

							if (isToday) {
								return {
									style: {
										border: '1px solid var(--mantine-color-blue-5)',
										borderRadius: 'var(--mantine-radius-sm)',
										fontWeight: 600,
									},
								};
							}

							return {};
						}}
						renderDay={(date) => {
							const day = dayjs(date).date();
							const hasAssignment = dueDates.some((d) =>
								dayjs(date).isSame(d, 'day')
							);

							return (
								<Box pos='relative' w='100%' h='100%'>
									<Box
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											height: '100%',
										}}
									>
										{day}
									</Box>
									{hasAssignment && (
										<Box
											pos='absolute'
											bottom={2}
											left='50%'
											style={{ transform: 'translateX(-50%)' }}
										>
											<Box
												w={5}
												h={5}
												bg='light-dark(var(--mantine-color-blue-6), var(--mantine-color-blue-3))'
												style={{ borderRadius: '50%' }}
											/>
										</Box>
									)}
								</Box>
							);
						}}
					/>
				</Box>
			)}

			<Divider my='lg' />

			<Group gap='lg' justify='center'>
				<Group gap={8}>
					<Box
						w={12}
						h={12}
						bg='light-dark(var(--mantine-color-blue-1), var(--mantine-color-blue-9))'
						style={{
							borderRadius: 'var(--mantine-radius-sm)',
							border:
								'1px solid light-dark(var(--mantine-color-blue-3), var(--mantine-color-blue-7))',
						}}
					/>
					<Text size='sm' fw={500} c='dimmed'>
						Upcoming
					</Text>
				</Group>
				<Group gap={8}>
					<Box
						w={12}
						h={12}
						bg='light-dark(var(--mantine-color-red-1), var(--mantine-color-red-9))'
						style={{
							borderRadius: 'var(--mantine-radius-sm)',
							border:
								'1px solid light-dark(var(--mantine-color-red-3), var(--mantine-color-red-7))',
						}}
					/>
					<Text size='sm' fw={500} c='dimmed'>
						Past Due
					</Text>
				</Group>
			</Group>
		</Paper>
	);
}
