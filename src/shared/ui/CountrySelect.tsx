'use client';

import { Group, Image, Select, type SelectProps, Text } from '@mantine/core';
import { useMemo } from 'react';
import { type CountryMeta, getCountryData } from '@/shared/lib/utils/countries';

type Props = Omit<SelectProps, 'data' | 'renderOption'>;

function getFlagUrl(iso2: string) {
	return `https://flagcdn.com/w40/${iso2.toLowerCase()}.png`;
}

function buildLookup(countries: CountryMeta[]) {
	const map = new Map<string, CountryMeta>();
	for (const c of countries) {
		map.set(c.name, c);
	}
	return map;
}

export default function CountrySelect(props: Props) {
	const countries = useMemo(() => getCountryData(), []);
	const lookup = useMemo(() => buildLookup(countries), [countries]);

	const data = useMemo(
		() => countries.map((c) => ({ value: c.name, label: c.name })),
		[countries]
	);

	const renderOption: SelectProps['renderOption'] = ({ option }) => {
		const country = lookup.get(option.value);
		return (
			<Group gap='sm' wrap='nowrap'>
				{country && (
					<Image
						src={getFlagUrl(country.iso2)}
						alt={option.label}
						w={20}
						h={14}
						radius={2}
						fit='cover'
					/>
				)}
				<Text size='sm'>{option.label}</Text>
			</Group>
		);
	};

	const selected = props.value ? lookup.get(props.value as string) : null;

	return (
		<Select
			searchable
			data={data}
			renderOption={renderOption}
			leftSection={
				selected && (
					<Image
						src={getFlagUrl(selected.iso2)}
						alt={selected.name}
						w={20}
						h={14}
						radius={2}
						fit='cover'
					/>
				)
			}
			{...props}
		/>
	);
}
