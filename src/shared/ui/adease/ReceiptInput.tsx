'use client';

import { Input, Text, TextInput } from '@mantine/core';
import { useEffect, useState } from 'react';

type Props = {
	label?: string;
	description?: string;
	required?: boolean;
	error?: string | null;
	value?: string;
	onChange?: (value: string) => void;
};

type ReceiptType = 'PMRC' | 'SR' | null;

function parseReceipt(value: string): { type: ReceiptType; digits: string } {
	if (value.startsWith('SR-')) {
		return {
			type: 'SR',
			digits: value.slice(3).replace(/\D/g, '').slice(0, 5),
		};
	}
	if (value.startsWith('PMRC')) {
		return {
			type: 'PMRC',
			digits: value.slice(4).replace(/\D/g, '').slice(0, 5),
		};
	}
	return { type: null, digits: '' };
}

function formatReceipt(type: ReceiptType, digits: string): string {
	if (!type || !digits) return '';
	return type === 'SR' ? `SR-${digits}` : `PMRC${digits}`;
}

function isValid(value: string): boolean {
	if (!value) return true;
	return /^(PMRC\d{5}|SR-\d{5})$/.test(value);
}

export default function ReceiptInput({
	label,
	description,
	required,
	error,
	value = '',
	onChange,
}: Props) {
	const parsed = parseReceipt(value);
	const [type, setType] = useState<ReceiptType>(parsed.type);
	const [digits, setDigits] = useState(parsed.digits);
	const [touched, setTouched] = useState(false);

	useEffect(() => {
		if (value) {
			const p = parseReceipt(value);
			setType(p.type);
			setDigits(p.digits);
		} else {
			setType(null);
			setDigits('');
		}
	}, [value]);

	function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
		const input = e.target.value.toUpperCase();

		if (!type) {
			if (input === 'S' || input.startsWith('SR')) {
				setType('SR');
				const digitPart = input
					.replace(/^SR-?/, '')
					.replace(/\D/g, '')
					.slice(0, 5);
				setDigits(digitPart);
				onChange?.(formatReceipt('SR', digitPart));
				return;
			}
			if (
				input === 'P' ||
				input.startsWith('PM') ||
				input.startsWith('PMR') ||
				input.startsWith('PMRC')
			) {
				setType('PMRC');
				const digitPart = input
					.replace(/^PMRC?/, '')
					.replace(/\D/g, '')
					.slice(0, 5);
				setDigits(digitPart);
				onChange?.(formatReceipt('PMRC', digitPart));
				return;
			}
			onChange?.('');
			return;
		}

		const digitPart = input.replace(/\D/g, '').slice(0, 5);
		setDigits(digitPart);
		onChange?.(formatReceipt(type, digitPart));
	}

	function handleBlur() {
		setTouched(true);
	}

	const currentValue = formatReceipt(type, digits);
	const validationError =
		touched && currentValue && !isValid(currentValue)
			? 'Must have exactly 5 digits'
			: null;

	const prefix = type === 'SR' ? 'SR-' : type === 'PMRC' ? 'PMRC' : null;

	return (
		<Input.Wrapper
			label={label}
			description={description}
			required={required}
			error={error || validationError}
		>
			<Input
				component='div'
				pointer={false}
				styles={{
					input: {
						display: 'flex',
						alignItems: 'center',
						gap: 0,
						padding: '0 8px',
						height: 36,
					},
				}}
			>
				{prefix && (
					<Text
						size='sm'
						fw={600}
						c='dimmed'
						style={{ fontFamily: 'monospace', userSelect: 'none' }}
					>
						{prefix}
					</Text>
				)}
				<TextInput
					variant='unstyled'
					placeholder={prefix ? '00000' : 'Type SR or PMRC...'}
					value={digits}
					onChange={handleInputChange}
					onBlur={handleBlur}
					styles={{
						input: {
							width: prefix ? 70 : 160,
							fontFamily: 'monospace',
							fontSize: 14,
							paddingLeft: prefix ? 4 : 0,
						},
					}}
				/>
			</Input>
		</Input.Wrapper>
	);
}
