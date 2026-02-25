'use client';

import {
	ActionIcon,
	Button,
	Group,
	Indicator,
	Modal,
	Paper,
	Select,
	Stack,
	Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { getAllGraduationDates } from '@registry/graduation/dates';
import { IconFilter, IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { selectedGraduationDateAtom } from '@/shared/ui/atoms/graduationAtoms';

const DEFAULT_STATUS = 'pending';

const statusOptions = [
	{ value: 'all', label: 'All Status' },
	{ value: 'pending', label: 'Pending' },
	{ value: 'approved', label: 'Approved' },
	{ value: 'rejected', label: 'Rejected' },
];

interface GraduationDateFilterProps {
	statusValue?: string;
	onStatusChange?: (status: string) => void;
	onDateChange?: (dateId: number | null) => void;
	label?: string;
	size?: number;
	color?: string;
	variant?: string;
}

export default function GraduationDateFilter({
	statusValue = DEFAULT_STATUS,
	onStatusChange,
	onDateChange,
	label = 'Filter graduation clearance',
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
	const [status, setStatus] = useState(statusValue);

	useEffect(() => {
		if (!selectedDate && graduationDates && graduationDates.length > 0) {
			const latestDate = graduationDates[0];
			if (latestDate) {
				setSelectedDate(latestDate.id);
				onDateChange?.(latestDate.id);
			}
		}
	}, [selectedDate, graduationDates, onDateChange, setSelectedDate]);

	function handleOpen() {
		setStatus(statusValue);
		open();
	}

	function handleClear() {
		setStatus(DEFAULT_STATUS);
		if (graduationDates && graduationDates.length > 0) {
			setSelectedDate(graduationDates[0].id);
			onDateChange?.(graduationDates[0].id);
		}
		onStatusChange?.(DEFAULT_STATUS);
		close();
	}

	function handleApply() {
		onStatusChange?.(status);
		close();
	}

	const isDefaultSelected =
		graduationDates &&
		graduationDates.length > 0 &&
		selectedDate === graduationDates[0].id;

	const activeFiltersCount = [
		statusValue !== DEFAULT_STATUS,
		!isDefaultSelected,
	].filter(Boolean).length;

	const isDefaultFilter = statusValue === DEFAULT_STATUS && isDefaultSelected;

	const dateOptions = graduationDates?.map((date) => ({
		value: date.id.toString(),
		label: date.date,
	}));

	return (
		<>
			<Tooltip label={label}>
				<Indicator
					label={activeFiltersCount || undefined}
					size={16}
					color='red'
					disabled={activeFiltersCount === 0}
				>
					<ActionIcon
						variant={isLoading || isDefaultFilter ? variant : 'filled'}
						color={color}
						onClick={handleOpen}
						size={'input-sm'}
						loading={isLoading}
					>
						<IconFilter size={size} />
					</ActionIcon>
				</Indicator>
			</Tooltip>

			<Modal
				opened={opened}
				onClose={close}
				title='Filter Graduation Clearance'
				size='sm'
			>
				<Paper p='md' withBorder>
					<Stack gap='md'>
						<Select
							label='Status'
							placeholder='Select status'
							data={statusOptions}
							value={status}
							onChange={(val) => setStatus(val || DEFAULT_STATUS)}
						/>

						<Select
							label='Graduation Date'
							placeholder='Choose a date'
							data={dateOptions}
							value={selectedDate?.toString() || null}
							onChange={(val) => {
								if (val) {
									setSelectedDate(Number.parseInt(val, 10));
									onDateChange?.(Number.parseInt(val, 10));
								} else {
									setSelectedDate(null);
									onDateChange?.(null);
								}
							}}
							clearable
						/>

						<Group justify='space-between' mt='md'>
							<Button
								variant='subtle'
								color='gray'
								leftSection={<IconX size={16} />}
								onClick={handleClear}
								disabled={isDefaultFilter ?? false}
							>
								Clear All
							</Button>
							<Button onClick={handleApply}>Apply Filters</Button>
						</Group>
					</Stack>
				</Paper>
			</Modal>
		</>
	);
}
