'use client';

import { getAllProgramsWithLevel } from '@academic/schools';
import type { ProgramLevel } from '@academic/schools/_schema/programs';
import {
	Accordion,
	Badge,
	Box,
	Checkbox,
	Group,
	Loader,
	Stack,
	Text,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

type Program = {
	id: number;
	code: string;
	name: string;
	level: ProgramLevel;
};

type Props = {
	value: number[];
	onChange: (value: number[]) => void;
	error?: string;
};

const LEVEL_LABELS: Record<ProgramLevel, string> = {
	certificate: 'Certificate',
	diploma: 'Diploma',
	degree: 'Degree',
};

const LEVEL_ORDER: ProgramLevel[] = ['certificate', 'diploma', 'degree'];

export default function ProgramSelector({ value, onChange, error }: Props) {
	const { data: programs = [], isLoading } = useQuery({
		queryKey: ['programs-with-level'],
		queryFn: getAllProgramsWithLevel,
	});

	const grouped = useMemo(() => {
		const map = new Map<ProgramLevel, Program[]>();
		for (const level of LEVEL_ORDER) {
			map.set(level, []);
		}
		for (const p of programs) {
			const list = map.get(p.level) ?? [];
			list.push(p);
			map.set(p.level, list);
		}
		return map;
	}, [programs]);

	const selectedSet = useMemo(() => new Set(value), [value]);

	function handleLevelToggle(level: ProgramLevel, checked: boolean) {
		const levelPrograms = grouped.get(level) ?? [];
		const levelIds = levelPrograms.map((p) => p.id);
		if (checked) {
			const newValue = [
				...value,
				...levelIds.filter((id) => !selectedSet.has(id)),
			];
			onChange(newValue);
		} else {
			onChange(value.filter((id) => !levelIds.includes(id)));
		}
	}

	function handleProgramToggle(programId: number, checked: boolean) {
		if (checked) {
			onChange([...value, programId]);
		} else {
			onChange(value.filter((id) => id !== programId));
		}
	}

	function isLevelFullySelected(level: ProgramLevel) {
		const levelPrograms = grouped.get(level) ?? [];
		return (
			levelPrograms.length > 0 &&
			levelPrograms.every((p) => selectedSet.has(p.id))
		);
	}

	function isLevelPartiallySelected(level: ProgramLevel) {
		const levelPrograms = grouped.get(level) ?? [];
		const selectedCount = levelPrograms.filter((p) =>
			selectedSet.has(p.id)
		).length;
		return selectedCount > 0 && selectedCount < levelPrograms.length;
	}

	function getLevelSelectedCount(level: ProgramLevel) {
		const levelPrograms = grouped.get(level) ?? [];
		return levelPrograms.filter((p) => selectedSet.has(p.id)).length;
	}

	if (isLoading) {
		return (
			<Box py='md'>
				<Loader size='sm' />
			</Box>
		);
	}

	return (
		<Box>
			<Text fw={500} size='sm' mb='xs'>
				Open Programs
			</Text>
			<Text size='xs' c='dimmed' mb='sm'>
				Select which programs are open for applications during this intake
				period
			</Text>
			{error && (
				<Text size='xs' c='red' mb='sm'>
					{error}
				</Text>
			)}
			<Accordion variant='separated' multiple>
				{LEVEL_ORDER.map((level) => {
					const levelPrograms = grouped.get(level) ?? [];
					const selectedCount = getLevelSelectedCount(level);
					const isFullySelected = isLevelFullySelected(level);
					const isPartial = isLevelPartiallySelected(level);

					return (
						<Accordion.Item key={level} value={level}>
							<Accordion.Control>
								<Group justify='space-between' wrap='nowrap' pr='md'>
									<Group gap='sm'>
										<Checkbox
											checked={isFullySelected}
											indeterminate={isPartial}
											onChange={(e) => {
												e.stopPropagation();
												handleLevelToggle(level, e.currentTarget.checked);
											}}
											onClick={(e) => e.stopPropagation()}
										/>
										<Text fw={500}>{LEVEL_LABELS[level]} Programs</Text>
									</Group>
									<Badge variant='light' size='sm'>
										{selectedCount} / {levelPrograms.length}
									</Badge>
								</Group>
							</Accordion.Control>
							<Accordion.Panel>
								<Stack gap='xs' pl='xl'>
									{levelPrograms.map((program) => (
										<Checkbox
											key={program.id}
											label={`${program.code} - ${program.name}`}
											checked={selectedSet.has(program.id)}
											onChange={(e) =>
												handleProgramToggle(program.id, e.currentTarget.checked)
											}
										/>
									))}
									{levelPrograms.length === 0 && (
										<Text size='sm' c='dimmed'>
											No programs at this level
										</Text>
									)}
								</Stack>
							</Accordion.Panel>
						</Accordion.Item>
					);
				})}
			</Accordion>
			<Text size='xs' c='dimmed' mt='sm'>
				{value.length} program{value.length !== 1 ? 's' : ''} selected
			</Text>
		</Box>
	);
}
