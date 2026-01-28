'use client';

import { getStructuresByProgramId } from '@academic/schools/structures/_server/actions';
import {
	ActionIcon,
	Button,
	Group,
	Modal,
	Select,
	Stack,
	Text,
	Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { updateStudentProgramStructure } from '../../_server/actions';

interface Props {
	stdNo: number;
	programId: number;
	currentStructureId: number;
	currentStructureCode: string;
}

export default function EditStructureModal({
	stdNo,
	programId,
	currentStructureId,
	currentStructureCode,
}: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [selectedStructureId, setSelectedStructureId] = useState<string | null>(
		String(currentStructureId)
	);
	const queryClient = useQueryClient();

	const { data: structures, isLoading } = useQuery({
		queryKey: ['structures-by-program', programId],
		queryFn: () => getStructuresByProgramId(programId),
		enabled: opened,
	});

	const mutation = useMutation({
		mutationFn: async (structureId: number) => {
			return updateStudentProgramStructure(stdNo, structureId);
		},
		onSuccess: () => {
			notifications.show({
				message: 'Structure updated successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({ queryKey: ['student', stdNo] });
			close();
		},
		onError: (error) => {
			notifications.show({
				message: `Failed to update structure: ${error.message}`,
				color: 'red',
			});
		},
	});

	const handleSave = () => {
		if (selectedStructureId) {
			mutation.mutate(Number(selectedStructureId));
		}
	};

	const structureOptions =
		structures?.map((s) => ({
			value: String(s.id),
			label: `${s.code}${s.desc ? ` - ${s.desc}` : ''}`,
		})) || [];

	return (
		<>
			<Tooltip label='Change Structure'>
				<ActionIcon variant='subtle' color='dimmed' onClick={open}>
					<IconEdit size={16} />
				</ActionIcon>
			</Tooltip>

			<Modal
				opened={opened}
				onClose={close}
				title='Change Program Structure'
				size='md'
			>
				<Stack gap='md'>
					<Text size='sm' c='dimmed'>
						Select a different structure within the same program.
					</Text>

					<Select
						label='Structure'
						placeholder='Select structure'
						data={structureOptions}
						value={selectedStructureId}
						onChange={setSelectedStructureId}
						searchable
						disabled={isLoading}
					/>

					<Group gap='xs'>
						<Text size='sm' c='dimmed'>
							Current structure:
						</Text>
						<Text size='sm' fw={500}>
							{currentStructureCode}
						</Text>
					</Group>

					<Group justify='flex-end' gap='sm'>
						<Button variant='default' onClick={close}>
							Cancel
						</Button>
						<Button
							onClick={handleSave}
							loading={mutation.isPending}
							disabled={
								!selectedStructureId ||
								Number(selectedStructureId) === currentStructureId
							}
						>
							Save
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
