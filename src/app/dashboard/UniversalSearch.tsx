'use client';

import {
	Box,
	Center,
	Divider,
	Group,
	Kbd,
	Loader,
	Text,
	TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { Spotlight, spotlight } from '@mantine/spotlight';
import {
	IconBook,
	IconBookUpload,
	IconBriefcase,
	IconBuildingArch,
	IconCertificate,
	IconCoin,
	IconFileCheck,
	IconLock,
	IconSchool,
	IconSearch,
	IconUser,
	IconUserSearch,
	IconUsers,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { type SearchResultGroup, universalSearch } from './_server/actions';

type IconComponent = typeof IconSearch;

const iconMap: Record<string, IconComponent> = {
	IconUser,
	IconUsers,
	IconBook,
	IconSchool,
	IconCertificate,
	IconUserSearch,
	IconBriefcase,
	IconBookUpload,
	IconCoin,
	IconLock,
	IconFileCheck,
	IconBuildingArch,
};

interface UniversalSearchProps {
	value: string;
	onChange: (value: string) => void;
}

export default function UniversalSearch({
	value,
	onChange,
}: UniversalSearchProps) {
	return (
		<Box
			pos='sticky'
			top={0}
			pt='sm'
			pb='xs'
			mt='calc(var(--mantine-spacing-sm) * -1)'
			style={{ zIndex: 1000 }}
			bg='var(--mantine-color-body)'
		>
			<TextInput
				placeholder='Search...'
				leftSection={<IconSearch size='0.9rem' />}
				rightSection={
					<Kbd size='xs' px={5} py={2}>
						Ctrl+K
					</Kbd>
				}
				rightSectionWidth={60}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onClick={() => spotlight.open()}
				variant='unstyled'
			/>
			<Divider mt={5} />
		</Box>
	);
}

export function SearchSpotlight() {
	const router = useRouter();
	const [query, setQuery] = useState('');
	const [debounced] = useDebouncedValue(query, 300);

	const { data, isLoading } = useQuery({
		queryKey: ['universal-search', debounced],
		queryFn: () => universalSearch(debounced),
		enabled: debounced.length >= 3,
	});

	const groups = data ?? [];
	const hasResults = groups.some((g) => g.items.length > 0);
	const showEmpty = debounced.length >= 3 && !isLoading && !hasResults;
	const showHint = debounced.length < 3 && !isLoading;

	return (
		<Spotlight.Root query={query} onQueryChange={setQuery} shortcut='mod+K'>
			<Spotlight.Search
				placeholder='Search students, modules, users...'
				leftSection={<IconSearch size='1.1rem' />}
				rightSection={isLoading ? <Loader size='xs' /> : null}
			/>
			<Spotlight.ActionsList>
				{showHint && (
					<Spotlight.Empty>
						<Text size='sm' c='dimmed'>
							Type at least 3 characters to search
						</Text>
					</Spotlight.Empty>
				)}
				{showEmpty && <Spotlight.Empty>No results found</Spotlight.Empty>}
				{groups.map((group) => (
					<ResultGroup
						key={group.category}
						group={group}
						onSelect={(href) => {
							router.push(href);
							spotlight.close();
						}}
					/>
				))}
			</Spotlight.ActionsList>
		</Spotlight.Root>
	);
}

type ResultGroupProps = {
	group: SearchResultGroup;
	onSelect: (href: string) => void;
};

function ResultGroup({ group, onSelect }: ResultGroupProps) {
	const Icon = iconMap[group.iconName] ?? IconSearch;

	return (
		<Spotlight.ActionsGroup label={group.category}>
			{group.items.map((item) => (
				<Spotlight.Action key={item.id} onClick={() => onSelect(item.href)}>
					<Group wrap='nowrap' w='100%'>
						<Center>
							<Icon size='1.2rem' />
						</Center>
						<div style={{ flex: 1 }}>
							<Text size='sm'>{item.label}</Text>
							{item.description && (
								<Text size='xs' c='dimmed'>
									{item.description}
								</Text>
							)}
						</div>
						<Text size='xs' c='dimmed' style={{ flexShrink: 0 }}>
							{item.href}
						</Text>
					</Group>
				</Spotlight.Action>
			))}
		</Spotlight.ActionsGroup>
	);
}
