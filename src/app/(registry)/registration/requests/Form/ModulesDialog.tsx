import {
	Accordion,
	ActionIcon,
	Box,
	Button,
	Modal,
	Stack,
	Table,
	Text,
	TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { type ReactNode, useState } from 'react';
import { compareSemesters } from '@/lib/utils/utils';
import type { modules, semesterModules } from '@/shared/db/schema';

type Module = typeof modules.$inferSelect;

type SemesterModule = typeof semesterModules.$inferSelect & {
	semesterNumber?: string;
	semesterName?: string;
	module: Module;
};

interface ModulesDialogProps {
	onAddModule: (module: SemesterModule) => void;
	modules: SemesterModule[];
	isLoading: boolean;
	selectedModules: { id: number }[];
	disabled?: boolean;
	children?: ReactNode;
}

export default function ModulesDialog({
	onAddModule,
	modules: availableModules,
	isLoading,
	selectedModules,
	disabled = false,
	children,
}: ModulesDialogProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const [searchQuery, setSearchQuery] = useState('');

	const filteredModules = availableModules
		? availableModules.filter(
				(mod) =>
					mod.module.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
					mod.module.name.toLowerCase().includes(searchQuery.toLowerCase())
			)
		: [];

	const modulesBySemester = filteredModules.reduce(
		(acc, module) => {
			const semesterKey = module.semesterNumber ?? '';
			if (!acc[semesterKey]) {
				acc[semesterKey] = {
					name: module.semesterName || `Semester ${semesterKey}`,
					modules: [],
				};
			}
			acc[semesterKey].modules.push(module);
			return acc;
		},
		{} as Record<string, { name: string; modules: SemesterModule[] }>
	);

	const handleAddModule = (module: SemesterModule) => {
		onAddModule(module);
		close();
	};

	return (
		<>
			{children ? (
				<button
					type='button'
					disabled={disabled}
					onClick={open}
					style={{
						border: 'none',
						background: 'none',
						padding: 0,
						cursor: disabled ? 'not-allowed' : 'pointer',
					}}
				>
					{children}
				</button>
			) : (
				<ActionIcon onClick={open} disabled={disabled}>
					<IconPlus size='1rem' />
				</ActionIcon>
			)}

			<Modal opened={opened} onClose={close} title='Select Module' size='xl'>
				<Stack>
					<TextInput
						placeholder='Search modules...'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						leftSection={<IconSearch size='1rem' />}
					/>

					<Box style={{ maxHeight: '600px', overflow: 'auto' }}>
						{isLoading ? (
							<Text ta='center' p='md'>
								Loading modules...
							</Text>
						) : filteredModules.length === 0 ? (
							<Text c='dimmed' ta='center' p='md'>
								No modules found
							</Text>
						) : (
							<Accordion variant='separated'>
								{Object.entries(modulesBySemester)
									.sort(([a], [b]) => compareSemesters(a, b))
									.map(([semester, { name, modules }]) => (
										<Accordion.Item key={semester} value={semester}>
											<Accordion.Control>
												<Text fw={500}>{name}</Text>
											</Accordion.Control>
											<Accordion.Panel>
												<Table striped highlightOnHover>
													<Table.Thead>
														<Table.Tr>
															<Table.Th>Code</Table.Th>
															<Table.Th>Name</Table.Th>
															<Table.Th>Type</Table.Th>
															<Table.Th>Credits</Table.Th>
															<Table.Th>Action</Table.Th>
														</Table.Tr>
													</Table.Thead>
													<Table.Tbody>
														{modules.map((semModule) => (
															<Table.Tr key={semModule.id}>
																<Table.Td>{semModule.module.code}</Table.Td>
																<Table.Td>{semModule.module.name}</Table.Td>
																<Table.Td>{semModule.type}</Table.Td>
																<Table.Td>{semModule.credits}</Table.Td>
																<Table.Td>
																	<Button
																		size='xs'
																		variant='light'
																		onClick={() => handleAddModule(semModule)}
																		disabled={selectedModules.some(
																			(m) => m.id === semModule.id
																		)}
																	>
																		{selectedModules.some(
																			(m) => m.id === semModule.id
																		)
																			? 'Added'
																			: 'Add'}
																	</Button>
																</Table.Td>
															</Table.Tr>
														))}
													</Table.Tbody>
												</Table>
											</Accordion.Panel>
										</Accordion.Item>
									))}
							</Accordion>
						)}
					</Box>
				</Stack>
			</Modal>
		</>
	);
}
