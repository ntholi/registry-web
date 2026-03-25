'use client';

import {
	getAllPrograms,
	getAllSchools,
} from '@academic/schools/_server/actions';
import {
	Button,
	Group,
	Modal,
	MultiSelect,
	Select,
	Stack,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconEdit, IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
	formatSemesterNumber,
	RESTRICTION_META,
	type Restriction,
	type RestrictionOperator,
	type RestrictionType,
	restrictionTypes,
} from '../../_lib/restrictions';

type Props = {
	onSave: (restriction: Restriction) => void;
	initial?: Restriction;
	usedTypes?: RestrictionType[];
};

export default function RestrictionModal({
	onSave,
	initial,
	usedTypes,
}: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [type, setType] = useState<RestrictionType | null>(
		initial?.type ?? null
	);
	const [operator, setOperator] = useState<RestrictionOperator>(
		initial?.operator ?? 'include'
	);
	const [values, setValues] = useState<string[]>(initial?.values ?? []);

	const { data: schools } = useQuery({
		queryKey: ['schools-all'],
		queryFn: getAllSchools,
		enabled: opened && type === 'school',
	});

	const { data: programs } = useQuery({
		queryKey: ['programs-all'],
		queryFn: getAllPrograms,
		enabled: opened && type === 'programName',
	});

	const meta = type ? RESTRICTION_META[type] : null;

	function getOptions(): string[] {
		if (!type) return [];
		if (meta?.options) return meta.options;
		if (type === 'school') return schools?.map((s) => s.name) ?? [];
		if (type === 'programName') return programs?.map((p) => p.name) ?? [];
		return [];
	}

	function getOptionLabel(opt: string): string {
		if (type === 'semesterNumber') return formatSemesterNumber(opt);
		return opt;
	}

	const availableTypes = restrictionTypes.filter(
		(t) => !usedTypes?.includes(t) || t === initial?.type
	);

	function handleSave() {
		if (!type || values.length === 0) return;
		onSave({ type, operator, values });
		close();
		if (!initial) {
			setType(null);
			setOperator('include');
			setValues([]);
		}
	}

	function handleOpen() {
		if (initial) {
			setType(initial.type);
			setOperator(initial.operator);
			setValues(initial.values);
		}
		open();
	}

	return (
		<>
			{initial ? (
				<Button
					variant='subtle'
					size='compact-sm'
					leftSection={<IconEdit size={14} />}
					onClick={handleOpen}
				>
					Edit
				</Button>
			) : (
				<Button
					variant='light'
					size='compact-sm'
					leftSection={<IconPlus size={14} />}
					onClick={handleOpen}
				>
					Add Restriction
				</Button>
			)}

			<Modal
				opened={opened}
				onClose={close}
				title={initial ? 'Edit Restriction' : 'Add Restriction'}
				size='md'
			>
				<Stack>
					<Select
						label='Restriction Type'
						placeholder='Select type'
						data={availableTypes.map((t) => ({
							value: t,
							label: RESTRICTION_META[t].label,
						}))}
						value={type}
						onChange={(v) => {
							setType(v as RestrictionType);
							setValues([]);
						}}
					/>
					{type && (
						<Select
							label='Operator'
							data={[
								{ value: 'include', label: 'Must be one of (Include)' },
								{ value: 'exclude', label: 'Must NOT be any of (Exclude)' },
							]}
							value={operator}
							onChange={(v) => setOperator(v as RestrictionOperator)}
						/>
					)}
					{type && (
						<MultiSelect
							label={meta?.label ?? 'Values'}
							description={meta?.description}
							placeholder='Select values'
							data={getOptions().map((o) => ({
								value: o,
								label: getOptionLabel(o),
							}))}
							value={values}
							onChange={setValues}
							searchable
						/>
					)}
					<Group justify='flex-end'>
						<Button variant='default' onClick={close}>
							Cancel
						</Button>
						<Button
							onClick={handleSave}
							disabled={!type || values.length === 0}
						>
							{initial ? 'Update' : 'Add'}
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
