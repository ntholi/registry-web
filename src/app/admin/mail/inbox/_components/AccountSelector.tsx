'use client';

import { Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getAccessibleMailAccounts } from '../../accounts/_server/actions';

type AccessibleAccount = {
	id: string;
	email: string;
	displayName: string | null;
};

type Props = {
	value: string | null;
	onChange: (id: string | null) => void;
};

export function AccountSelector({ value, onChange }: Props) {
	const { data: accounts = [] } = useQuery({
		queryKey: ['accessible-mail-accounts'],
		queryFn: () => getAccessibleMailAccounts() as Promise<AccessibleAccount[]>,
	});

	if (accounts.length <= 1) return null;

	return (
		<Select
			size='xs'
			placeholder='Account'
			value={value}
			onChange={onChange}
			data={accounts.map((a) => ({
				value: a.id,
				label: a.displayName || a.email,
			}))}
			w={160}
			styles={{ input: { fontSize: 'var(--mantine-font-size-xs)' } }}
		/>
	);
}
