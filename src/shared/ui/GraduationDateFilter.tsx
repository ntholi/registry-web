'use client';

import { ActionIcon, Modal, Paper, Select, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { getAllGraduationDates } from '@registry/graduation/dates';
import { IconFilter } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { selectedGraduationDateAtom } from '@/shared/ui/atoms/graduationAtoms';

interface GraduationDateFilterProps {
	onDateChange?: (dateId: number | null) => void;
	label?: string;
	size?: number;
	color?: string;
	variant?: string;
}

export default function GraduationDateFilter({
	onDateChange,
	label = 'Filter by graduation date',
	size = 16,
	color = 'blue',
	variant = 'default',
}: GraduationDateFilterProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const { data: graduationDates, isLoading } = useQuery({
		queryKey: ['graduation-dates'],
		queryFn: () => getAllGraduationDates(),
		staleTime: 1000 * 60 * 10,
	});
	const [selectedDate, setSelectedDate] = useAtom(selectedGraduationDateAtom);

	useEffect(() => {
		if (!selectedDate && graduationDates && graduationDates.length > 0) {
			const latestDate = graduationDates[0]; // Assuming it's sorted or just pick the first one
			if (latestDate) {
				setSelectedDate(latestDate.id);
				onDateChange?.(latestDate.id);
			}
		}
	}, [selectedDate, graduationDates, onDateChange, setSelectedDate]);

	const handleDateSelect = (dateId: string | null) => {
		if (dateId) {
			setSelectedDate(parseInt(dateId, 10));
		} else {
			setSelectedDate(null);
		}
		close();
	};

	const dateOptions = graduationDates?.map((date) => ({
		value: date.id.toString(),
		label: date.date,
	}));

	const isDefaultSelected =
		graduationDates &&
		graduationDates.length > 0 &&
		selectedDate === graduationDates[0].id;

	return (
		<>
			<Tooltip label={label}>
				<ActionIcon
					variant={isLoading || isDefaultSelected ? variant : 'white'}
					color={color}
					onClick={open}
					size={'input-sm'}
					loading={isLoading}
				>
					<IconFilter size={size} />
				</ActionIcon>
			</Tooltip>

			<Modal
				opened={opened}
				onClose={close}
				title='Filter by Graduation Date'
				size='sm'
				p={'lg'}
			>
				<Paper p={'lg'} pb={'xl'} withBorder>
					<Select
						label='Select Graduation Date'
						placeholder='Choose a date'
						data={dateOptions}
						value={selectedDate?.toString() || null}
						onChange={handleDateSelect}
						clearable
					/>
				</Paper>
			</Modal>
		</>
	);
}
