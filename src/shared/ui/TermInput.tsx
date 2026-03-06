'use client';

import { Select, type SelectProps } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getAllTerms } from '@/app/registry/terms';

interface TermOption {
	id: number;
	code: string;
	isActive?: boolean | null;
}

type Props = Omit<SelectProps, 'data' | 'value' | 'onChange'> & {
	value?: number | string | null;
	onChange?: (value: number | string | null) => void;
	valueMode?: 'id' | 'code';
	terms?: TermOption[];
	autoSelectActive?: boolean;
	limit?: number;
};

export default function TermInput({
	value,
	onChange,
	valueMode = 'id',
	terms,
	autoSelectActive = true,
	label = 'Term',
	placeholder = 'Select term',
	searchable = true,
	limit = 15,
	disabled,
	...props
}: Props) {
	const { data: fetchedTerms = [], isLoading } = useQuery({
		queryKey: ['terms'],
		queryFn: getAllTerms,
		enabled: !terms,
	});

	const items = [...(terms ?? fetchedTerms)].sort((left, right) =>
		right.code.localeCompare(left.code)
	);
	const activeTerm = items.find((term) => term.isActive);

	useEffect(() => {
		if (!autoSelectActive || !activeTerm || !onChange) {
			return;
		}

		if (value !== null && value !== undefined && value !== '') {
			return;
		}

		onChange(valueMode === 'code' ? activeTerm.code : activeTerm.id);
	}, [activeTerm, autoSelectActive, onChange, value, valueMode]);

	return (
		<Select
			label={label}
			placeholder={placeholder}
			data={items.map((term) => ({
				value: valueMode === 'code' ? term.code : String(term.id),
				label: term.code,
			}))}
			value={
				value === null || value === undefined || value === ''
					? null
					: String(value)
			}
			onChange={(nextValue) => {
				if (!onChange) {
					return;
				}

				if (!nextValue) {
					onChange(null);
					return;
				}

				onChange(valueMode === 'code' ? nextValue : Number(nextValue));
			}}
			searchable={searchable}
			limit={limit}
			disabled={disabled || isLoading}
			{...props}
		/>
	);
}
