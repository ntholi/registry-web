'use client';

import { ActionIcon, Modal, Paper, Select, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { selectedTermAtom } from '@/atoms/termAtoms';
import { findAllTerms } from '@/server/terms/actions';

interface TermFilterProps {
	onTermChange?: (termId: number | null) => void;
	label?: string;
	size?: number;
	color?: string;
	variant?: string;
}

export default function TermFilter({
	onTermChange,
	label = 'Filter by term',
	size = 16,
	color = 'blue',
	variant = 'default',
}: TermFilterProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const { data: terms, isLoading } = useQuery({
		queryKey: ['allTerms'],
		queryFn: () => findAllTerms(),
		staleTime: 1000 * 60 * 10,
		select: (data) => data.items,
	});
	const [selectedTerm, setSelectedTerm] = useAtom(selectedTermAtom);

	useEffect(() => {
		if (!selectedTerm && terms && terms.length > 0) {
			const activeTerm = terms.find((term) => term.isActive);
			if (activeTerm) {
				setSelectedTerm(activeTerm.id);
				onTermChange?.(activeTerm.id);
			}
		}
	}, [selectedTerm, terms, onTermChange, setSelectedTerm]);

	const handleTermSelect = (termId: string | null) => {
		if (termId) {
			setSelectedTerm(parseInt(termId, 10));
		} else {
			setSelectedTerm(null);
		}
		close();
	};

	const termOptions = terms?.map((term) => ({
		value: term.id.toString(),
		label: term.name + (term.isActive ? ' (Current)' : ''),
	}));

	const currentTerm = terms?.find((term) => term.isActive);
	const isCurrentTermSelected = currentTerm && selectedTerm === currentTerm.id;

	return (
		<>
			<Tooltip label={label}>
				<ActionIcon
					variant={isLoading || isCurrentTermSelected ? variant : 'white'}
					color={color}
					onClick={open}
					size={'input-sm'}
					loading={isLoading}
				>
					<IconFilter size={size} />
				</ActionIcon>
			</Tooltip>

			<Modal opened={opened} onClose={close} title="Filter by Term" size="sm" p={'lg'}>
				<Paper p={'lg'} pb={'xl'} withBorder>
					<Select
						label="Select Term"
						placeholder="Choose a term"
						data={termOptions}
						value={selectedTerm?.toString() || null}
						onChange={handleTermSelect}
					/>
				</Paper>
			</Modal>
		</>
	);
}
