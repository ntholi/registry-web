'use client';

import {
	ActionIcon,
	Button,
	Card,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { ReceiptInput } from '@/shared/ui/adease';

type ModuleWithStatus = {
	semesterModuleId: number;
	code: string;
	name: string;
	status: string;
};

interface RepeatModuleReceiptsProps {
	repeatModules: ModuleWithStatus[];
	receipts: string[];
	onReceiptsChange: (receipts: string[]) => void;
	onRemoveModule: (moduleId: number) => void;
}

export default function RepeatModuleReceipts({
	repeatModules,
	receipts,
	onReceiptsChange,
	onRemoveModule,
}: RepeatModuleReceiptsProps) {
	const handleAddReceipt = (value: string) => {
		if (value.trim() && !receipts.includes(value.trim())) {
			onReceiptsChange([...receipts, value.trim()]);
		}
	};

	const handleRemoveReceipt = (index: number) => {
		onReceiptsChange(receipts.filter((_, i) => i !== index));
	};

	const validReceipts = receipts.filter(
		(r) => r && /^(PMRC\d{5}|SR-\d{5})$/.test(r)
	);

	return (
		<Stack gap='lg' mt='md'>
			<Paper p='lg' withBorder>
				<Stack gap='md'>
					<Title order={5}>Your Repeat Modules</Title>
					<Text size='sm' c='dimmed'>
						You have selected the following repeat modules. Provide payment
						receipts or remove modules to proceed without them.
					</Text>

					<Stack gap='xs'>
						{repeatModules.map((module) => (
							<Paper key={module.semesterModuleId} p='sm' withBorder>
								<Group justify='space-between' wrap='nowrap'>
									<div>
										<Text fw={500} size='sm'>
											{module.code}
										</Text>
										<Text size='xs' c='dimmed'>
											{module.name}
										</Text>
									</div>
									<ActionIcon
										color='red'
										variant='subtle'
										onClick={() => onRemoveModule(module.semesterModuleId)}
										title='Remove this repeat module'
									>
										<IconX size={16} />
									</ActionIcon>
								</Group>
							</Paper>
						))}
					</Stack>
				</Stack>
			</Paper>

			<Paper p='lg' withBorder>
				<Stack gap='md'>
					<Title order={5}>Payment Receipts</Title>
					<Text size='sm' c='dimmed'>
						Enter receipt numbers for repeat module payments. You can add
						multiple receipts if needed.
					</Text>

					<ReceiptInputWithAdd onAdd={handleAddReceipt} />

					{receipts.length > 0 && (
						<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='sm'>
							{receipts.map((receipt, index) => (
								<Card
									key={index}
									withBorder
									padding='lg'
									style={{ position: 'relative' }}
								>
									<Group justify='space-between' wrap='nowrap'>
										<Text size='sm' fw={500} truncate>
											{receipt}
										</Text>
										<ActionIcon
											color='red'
											variant='subtle'
											size='sm'
											onClick={() => handleRemoveReceipt(index)}
										>
											<IconTrash size={14} />
										</ActionIcon>
									</Group>
								</Card>
							))}
						</SimpleGrid>
					)}
				</Stack>
			</Paper>
		</Stack>
	);
}

type ReceiptInputWithAddProps = {
	onAdd: (value: string) => void;
};

function ReceiptInputWithAdd({ onAdd }: ReceiptInputWithAddProps) {
	const [value, setValue] = useState('');

	const handleAdd = () => {
		if (value.trim()) {
			onAdd(value.trim());
			setValue('');
		}
	};

	return (
		<Group gap='sm' align='flex-end'>
			<div style={{ flex: 1 }}>
				<ReceiptInput
					label='Receipt Number'
					value={value}
					onChange={setValue}
				/>
			</div>
			<Button
				variant='light'
				leftSection={<IconPlus size={16} />}
				onClick={handleAdd}
				disabled={!value.trim()}
			>
				Add
			</Button>
		</Group>
	);
}
