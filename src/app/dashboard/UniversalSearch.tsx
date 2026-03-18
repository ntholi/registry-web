'use client';

import {
	Box,
	Center,
	Divider,
	Group,
	Kbd,
	Loader,
	ScrollArea,
	Stack,
	Tabs,
	Text,
	TextInput,
	ThemeIcon,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { Spotlight, spotlight } from '@mantine/spotlight';
import {
	IconBook,
	IconBookUpload,
	IconBriefcase,
	IconBuildingArch,
	IconCertificate,
	IconChartDonut,
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
				leftSection={
					<ThemeIcon
						variant='transparent'
						color='rgba(207, 249, 255, 1)'
						mr={'xs'}
					>
						<IconSearch size='1.2rem' />
					</ThemeIcon>
				}
				rightSection={
					<Kbd size='xs' px={5} py={2}>
						Ctrl+K
					</Kbd>
				}
				rightSectionWidth={60}
				leftSectionWidth={40}
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
	const [activeTab, setActiveTab] = useState<string | null>(null);

	const { data, isLoading } = useQuery({
		queryKey: ['universal-search', debounced],
		queryFn: () => universalSearch(debounced),
		enabled: debounced.length >= 3,
	});

	const groups = data ?? [];
	const hasResults = groups.some((g) => g.items.length > 0);
	const showEmpty = debounced.length >= 3 && !isLoading && !hasResults;
	const showHint = debounced.length < 3 && !isLoading;
	const effectiveTab =
		activeTab && groups.some((g) => g.category === activeTab)
			? activeTab
			: (groups[0]?.category ?? null);

	function handleSelect(href: string) {
		router.push(href);
		spotlight.close();
	}

	return (
		<Spotlight.Root
			query={query}
			onQueryChange={(q) => {
				setQuery(q);
				setActiveTab(null);
			}}
			shortcut='mod+K'
		>
			<Spotlight.Search
				placeholder='Search students, modules, users...'
				leftSection={<IconSearch size='1.1rem' />}
				rightSection={isLoading ? <Loader size='xs' /> : null}
			/>
			<Spotlight.ActionsList>
				{showHint && (
					<Spotlight.Empty>
						<Group justify='space-between'>
							<Text size='sm' c='dimmed'>
								Search for Everything Everywhere All at Once
							</Text>
							<ThemeIcon variant='light' color='gray'>
								<IconChartDonut size={'0.9rem'} />
							</ThemeIcon>
						</Group>
					</Spotlight.Empty>
				)}
				{showEmpty && <Spotlight.Empty>No results found</Spotlight.Empty>}
				{hasResults && (
					<Tabs value={effectiveTab} onChange={setActiveTab}>
						<ScrollArea scrollbars='x' offsetScrollbars>
							<Tabs.List>
								{groups.map((g) => {
									const Icon = iconMap[g.iconName] ?? IconSearch;
									return (
										<Tabs.Tab
											key={g.category}
											value={g.category}
											leftSection={<Icon size='0.9rem' />}
										>
											{g.category}
										</Tabs.Tab>
									);
								})}
							</Tabs.List>
						</ScrollArea>
						{groups.map((g) => (
							<Tabs.Panel key={g.category} value={g.category} pt='xs'>
								<Stack gap={0}>
									{g.items.map((item) => (
										<ResultItem
											key={item.id}
											item={item}
											icon={iconMap[g.iconName] ?? IconSearch}
											onSelect={handleSelect}
										/>
									))}
								</Stack>
							</Tabs.Panel>
						))}
					</Tabs>
				)}
			</Spotlight.ActionsList>
		</Spotlight.Root>
	);
}

type ResultItemProps = {
	item: SearchResultGroup['items'][number];
	icon: IconComponent;
	onSelect: (href: string) => void;
};

function ResultItem({ item, icon: Icon, onSelect }: ResultItemProps) {
	return (
		<Spotlight.Action onClick={() => onSelect(item.href)}>
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
	);
}
