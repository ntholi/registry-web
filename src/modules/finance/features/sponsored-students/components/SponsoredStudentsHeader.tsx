'use client';

import { getAllPrograms } from '@academic/schools';
import { findAllSponsors } from '@finance/sponsors';
import {
	Box,
	Checkbox,
	CloseButton,
	Flex,
	Paper,
	Select,
	Stack,
	TextInput,
} from '@mantine/core';
import { getAllTerms } from '@registry/terms';
import { IconFilter, IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';

interface SponsoredStudentsHeaderProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	selectedSponsor: string | null;
	onSponsorChange: (value: string | null) => void;
	selectedProgram: string | null;
	onProgramChange: (value: string | null) => void;
	selectedConfirmation: string | null;
	onConfirmationChange: (value: string | null) => void;
	selectedTerm: string | null;
	onTermChange: (value: string | null) => void;
	onlyCleared: boolean;
	onOnlyClearedChange: (value: boolean) => void;
	onClearFilters: () => void;
	hasActiveFilters: boolean;
}

export default function SponsoredStudentsHeader({
	searchQuery,
	onSearchChange,
	selectedSponsor,
	onSponsorChange,
	selectedProgram,
	onProgramChange,
	selectedConfirmation,
	onConfirmationChange,
	selectedTerm,
	onTermChange,
	onlyCleared,
	onOnlyClearedChange,
	onClearFilters: _onClearFilters,
	hasActiveFilters: _hasActiveFilters,
}: SponsoredStudentsHeaderProps) {
	const { data: sponsors, isLoading: isLoadingSponsors } = useQuery({
		queryKey: ['sponsors'],
		queryFn: () => findAllSponsors(1, '').then((response) => response.items),
	});

	const { data: programs, isLoading: isLoadingPrograms } = useQuery({
		queryKey: ['all-programs'],
		queryFn: () => getAllPrograms(),
	});

	const { data: terms, isLoading: isLoadingTerms } = useQuery({
		queryKey: ['terms'],
		queryFn: () => getAllTerms(),
	});

	const sponsorOptions =
		sponsors?.map((sponsor) => ({
			value: sponsor.id.toString(),
			label: sponsor.name,
		})) || [];

	const programOptions =
		programs?.map((program) => ({
			value: program.id.toString(),
			label: `${program.code} - ${program.name}`,
		})) || [];

	const termOptions =
		terms?.map((term) => ({
			value: term.id.toString(),
			label: term.name + (term.isActive ? ' (Current)' : ''),
		})) || [];

	return (
		<Paper withBorder shadow='sm' p='lg'>
			<Stack gap='lg'>
				<Flex
					direction={{ base: 'column', sm: 'row' }}
					gap='md'
					align={{ base: 'stretch', sm: 'flex-end' }}
				>
					<Box flex={1}>
						<TextInput
							size='md'
							placeholder='Search students, sponsors, accounts...'
							value={searchQuery}
							onChange={(event) => onSearchChange(event.currentTarget.value)}
							leftSection={<IconSearch size='1.1rem' stroke={1.5} />}
							rightSection={
								searchQuery ? (
									<CloseButton
										onClick={() => onSearchChange('')}
										variant='subtle'
										size='sm'
									/>
								) : null
							}
							styles={{
								input: {
									fontSize: '14px',
									'&:focus': {
										borderColor: 'var(--mantine-color-blue-6)',
									},
								},
							}}
						/>
					</Box>
				</Flex>

				<Flex
					direction={{ base: 'column', md: 'row' }}
					gap='md'
					align={{ base: 'stretch', md: 'flex-start' }}
				>
					<Flex
						flex={1}
						direction={{ base: 'column', sm: 'row' }}
						gap='md'
						align='center'
					>
						<Box flex={1} miw={200}>
							<Select
								placeholder='All Sponsors'
								data={sponsorOptions}
								value={selectedSponsor}
								onChange={onSponsorChange}
								clearable
								searchable
								disabled={isLoadingSponsors}
								leftSection={<IconFilter size='0.9rem' stroke={1.5} />}
								comboboxProps={{
									withinPortal: true,
								}}
								styles={{
									input: {
										fontSize: '14px',
									},
								}}
							/>
						</Box>

						<Box flex={1} miw={200}>
							<Select
								placeholder='All Programs'
								data={programOptions}
								value={selectedProgram}
								onChange={onProgramChange}
								clearable
								searchable
								disabled={isLoadingPrograms}
								leftSection={<IconFilter size='0.9rem' stroke={1.5} />}
								comboboxProps={{
									withinPortal: true,
								}}
								styles={{
									input: {
										fontSize: '14px',
									},
								}}
							/>
						</Box>

						<Box flex={1} miw={200}>
							<Select
								placeholder='Confirmation'
								data={[
									{ value: 'confirmed', label: 'Confirmed' },
									{ value: 'pending', label: 'Pending' },
								]}
								value={selectedConfirmation}
								onChange={onConfirmationChange}
								clearable
								leftSection={<IconFilter size='0.9rem' stroke={1.5} />}
								comboboxProps={{
									withinPortal: true,
								}}
								styles={{
									input: {
										fontSize: '14px',
									},
								}}
							/>
						</Box>

						<Box flex={1} miw={200}>
							<Select
								placeholder='All Terms'
								data={termOptions}
								value={selectedTerm}
								onChange={onTermChange}
								clearable
								searchable
								disabled={isLoadingTerms}
								leftSection={<IconFilter size='0.9rem' stroke={1.5} />}
								comboboxProps={{
									withinPortal: true,
								}}
								styles={{
									input: {
										fontSize: '14px',
									},
								}}
							/>
						</Box>
						<Box miw={200}>
							<Checkbox
								label='Only Cleared Students'
								disabled={!selectedTerm}
								checked={onlyCleared}
								onChange={(e) => onOnlyClearedChange(e.currentTarget.checked)}
							/>
						</Box>
					</Flex>
				</Flex>
			</Stack>
		</Paper>
	);
}
