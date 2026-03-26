'use client';

import { Menu } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useQueryState } from 'nuqs';
import { useEffect } from 'react';
import { FilterButton } from '@/shared/ui/adease';
import type { AccessibleAccount } from '../../_lib/types';
import { getAccessibleMailAccounts } from '../../accounts/_server/actions';

export function AccountSelector() {
	const { data: accounts = [] } = useQuery({
		queryKey: ['accessible-mail-accounts'],
		queryFn: () => getAccessibleMailAccounts() as Promise<AccessibleAccount[]>,
	});

	const [accountId, setAccountId] = useQueryState('account', {
		shallow: false,
	});

	useEffect(() => {
		if (!accountId && accounts.length > 0) {
			setAccountId(accounts[0].id);
		}
	}, [accountId, accounts, setAccountId]);

	if (accounts.length <= 1) return null;

	const current = accounts.find((a) => a.id === accountId);

	return (
		<Menu position='bottom-end'>
			<Menu.Target>
				<FilterButton
					label={current?.displayName || current?.email || 'Account'}
					activeCount={0}
					onClick={() => {}}
				/>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Label>Account</Menu.Label>
				{accounts.map((account) => (
					<Menu.Item
						key={account.id}
						onClick={() => setAccountId(account.id)}
						bg={
							accountId === account.id
								? 'var(--mantine-color-default-hover)'
								: undefined
						}
					>
						{account.displayName || account.email}
					</Menu.Item>
				))}
			</Menu.Dropdown>
		</Menu>
	);
}
