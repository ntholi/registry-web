'use client';

import { type BoxProps, Group, Input, NumberInput, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { useId } from 'react';

type DurationInputProps = {
	label: string;
	description?: string;
	value: number;
	onChange: (value: number) => void;
	error?: ReactNode;
	required?: boolean;
	hoursLabel?: string;
	minutesLabel?: string;
	hoursPlaceholder?: string;
	minutesPlaceholder?: string;
} & BoxProps;

export default function DurationInput({
	label,
	description,
	value,
	onChange,
	error,
	required,
	hoursLabel = 'Hours',
	minutesLabel = 'Minutes',
	hoursPlaceholder = '0',
	minutesPlaceholder = '0',
	...others
}: DurationInputProps) {
	const normalizedValue = Number.isFinite(value) && value > 0 ? value : 0;
	const total = normalizedValue < 0 ? 0 : normalizedValue;
	const hours = Math.floor(total / 60);
	const minutes = total % 60;
	const hoursInputId = useId();
	const minutesInputId = useId();

	function stepHoldIntervalHandler(time: number) {
		return Math.max(1000 / time, 25);
	}

	function handleHoursChange(hoursValue: string | number) {
		const parsed =
			typeof hoursValue === 'number' ? hoursValue : Number(hoursValue);
		const safeHours = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
		onChange(safeHours * 60 + minutes);
	}

	function handleMinutesChange(minutesValue: string | number) {
		const parsed =
			typeof minutesValue === 'number' ? minutesValue : Number(minutesValue);
		let safeMinutes = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
		if (safeMinutes > 59) {
			safeMinutes = 59;
		}
		onChange(hours * 60 + safeMinutes);
	}

	return (
		<Input.Wrapper
			label={label}
			description={description}
			error={error}
			required={required}
			{...others}
		>
			<Group gap='sm' wrap='nowrap'>
				<div>
					<Text
						size='xs'
						fw={500}
						mb={4}
						htmlFor={hoursInputId}
						component='label'
					>
						{hoursLabel}
					</Text>
					<NumberInput
						id={hoursInputId}
						value={hours}
						onChange={handleHoursChange}
						placeholder={hoursPlaceholder}
						min={0}
						allowNegative={false}
						allowDecimal={false}
						stepHoldDelay={500}
						stepHoldInterval={stepHoldIntervalHandler}
						aria-label={hoursLabel}
						w={120}
					/>
				</div>
				<div>
					<Text
						size='xs'
						fw={500}
						mb={4}
						htmlFor={minutesInputId}
						component='label'
					>
						{minutesLabel}
					</Text>
					<NumberInput
						id={minutesInputId}
						value={minutes}
						onChange={handleMinutesChange}
						placeholder={minutesPlaceholder}
						min={0}
						max={59}
						allowNegative={false}
						allowDecimal={false}
						stepHoldDelay={500}
						stepHoldInterval={stepHoldIntervalHandler}
						aria-label={minutesLabel}
						w={120}
					/>
				</div>
			</Group>
		</Input.Wrapper>
	);
}
