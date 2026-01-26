'use client';

import { moduleType } from '@academic/_database';
import {
	createModule as createBaseModule,
	getModules,
} from '@academic/modules';
import {
	createModule as createSemesterModule,
	findModulesByStructure,
} from '@academic/semester-modules';
import {
	ActionIcon,
	Button,
	Group,
	Loader,
	Modal,
	MultiSelect,
	NumberInput,
	Select,
	Stack,
	Tabs,
	Text,
	TextInput,
	Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

type Props = {
	semesterId: number;
	structureId: number;
};

function extractCreditsFromCode(code: string): number {
	const lastTwo = code.slice(-2);
	const credits = Number.parseInt(lastTwo, 10);
	return Number.isNaN(credits) ? 4 : credits;
}

function getTypeFromCredits(
	credits: number
): (typeof moduleType.enumValues)[number] {
	if (credits > 11) return 'Major';
	if (credits < 10) return 'Minor';
	return 'Core';
}

export default function AddSemesterModuleModal({
	semesterId,
	structureId,
}: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState<string | null>('search');
	const [searchQuery, setSearchQuery] = useState('');
	const [debouncedSearch] = useDebouncedValue(searchQuery, 300);
	const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

	const { data: modulesData, isLoading: isSearching } = useQuery({
		queryKey: ['base-modules', debouncedSearch],
		queryFn: () => getModules(1, debouncedSearch),
		enabled: opened && activeTab === 'search',
	});

	const { data: structureModules } = useQuery({
		queryKey: ['structure-modules', structureId],
		queryFn: () => findModulesByStructure(structureId),
		enabled: opened,
	});

	const prerequisiteOptions = Array.from(
		new Set(structureModules?.map((mod) => mod.module!.code) || [])
	)
		.map((code) => {
			const foundModule = structureModules?.find(
				(m) => m.module!.code === code
			);
			if (!foundModule) return null;
			return {
				value: code,
				label: `${foundModule.module!.code} - ${foundModule.module!.name}`,
			};
		})
		.filter(Boolean) as { value: string; label: string }[];

	const searchForm = useForm({
		initialValues: {
			moduleId: null as number | null,
			type: 'Core' as (typeof moduleType.enumValues)[number],
			credits: 4,
			prerequisiteCodes: [] as string[],
		},
		validate: {
			moduleId: (value) => (!value ? 'Select a module' : null),
			type: (value) => (!value ? 'Type is required' : null),
			credits: (value) => (!value || value <= 0 ? 'Credits required' : null),
		},
	});

	const createForm = useForm({
		initialValues: {
			code: '',
			name: '',
			type: 'Core' as (typeof moduleType.enumValues)[number],
			credits: 4,
			prerequisiteCodes: [] as string[],
		},
		validate: {
			code: (value) => (!value?.trim() ? 'Code is required' : null),
			name: (value) => (!value?.trim() ? 'Name is required' : null),
			type: (value) => (!value ? 'Type is required' : null),
			credits: (value) => (!value || value <= 0 ? 'Credits required' : null),
		},
	});

	const addFromSearchMutation = useMutation({
		mutationFn: async (values: typeof searchForm.values) => {
			return createSemesterModule({
				moduleId: values.moduleId!,
				semesterId,
				type: values.type,
				credits: values.credits,
				hidden: false,
				prerequisiteCodes: values.prerequisiteCodes,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['structure', structureId] });
			notifications.show({
				title: 'Success',
				message: 'Module added to semester',
				color: 'green',
			});
			handleClose();
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message || 'Failed to add module',
				color: 'red',
			});
		},
	});

	const createNewMutation = useMutation({
		mutationFn: async (values: typeof createForm.values) => {
			const baseModule = await createBaseModule({
				code: values.code.trim(),
				name: values.name.trim(),
				status: 'Active',
			});
			return createSemesterModule({
				moduleId: baseModule.id,
				semesterId,
				type: values.type,
				credits: values.credits,
				hidden: false,
				prerequisiteCodes: values.prerequisiteCodes,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['structure', structureId] });
			notifications.show({
				title: 'Success',
				message: 'Module created and added to semester',
				color: 'green',
			});
			handleClose();
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message || 'Failed to create module',
				color: 'red',
			});
		},
	});

	function handleClose() {
		close();
		searchForm.reset();
		createForm.reset();
		setSearchQuery('');
		setSelectedModuleId(null);
		setActiveTab('search');
	}

	const moduleOptions =
		modulesData?.items.map((mod) => ({
			value: mod.id.toString(),
			label: `${mod.code} - ${mod.name}`,
		})) ?? [];

	const handleSearchSubmit = searchForm.onSubmit((values) => {
		addFromSearchMutation.mutate(values);
	});

	const handleCreateSubmit = createForm.onSubmit((values) => {
		createNewMutation.mutate(values);
	});

	return (
		<>
			<Tooltip label='Add Module'>
				<ActionIcon variant='subtle' size='sm' onClick={open}>
					<IconPlus size='1rem' />
				</ActionIcon>
			</Tooltip>

			<Modal
				opened={opened}
				onClose={handleClose}
				title='Add Semester Module'
				size='md'
			>
				<Tabs value={activeTab} onChange={setActiveTab}>
					<Tabs.List mb='md'>
						<Tabs.Tab value='search' leftSection={<IconSearch size={14} />}>
							Search
						</Tabs.Tab>
						<Tabs.Tab value='create' leftSection={<IconPlus size={14} />}>
							Create New
						</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value='search'>
						<form onSubmit={handleSearchSubmit}>
							<Stack gap='md'>
								<Select
									label='Module'
									placeholder='Search for a module...'
									data={moduleOptions}
									value={selectedModuleId}
									onChange={(value) => {
										setSelectedModuleId(value);
										searchForm.setFieldValue(
											'moduleId',
											value ? Number(value) : null
										);
										if (value) {
											const mod = modulesData?.items.find(
												(m) => m.id.toString() === value
											);
											if (mod?.code) {
												const credits = extractCreditsFromCode(mod.code);
												const type = getTypeFromCredits(credits);
												searchForm.setFieldValue('credits', credits);
												searchForm.setFieldValue('type', type);
											}
										}
									}}
									searchable
									onSearchChange={setSearchQuery}
									nothingFoundMessage={
										isSearching ? (
											<Group gap='xs'>
												<Loader size='xs' />
												<Text size='sm'>Searching...</Text>
											</Group>
										) : (
											'No modules found'
										)
									}
									error={searchForm.errors.moduleId}
								/>
								<Select
									label='Type'
									data={moduleType.enumValues.map((t) => ({
										value: t,
										label: t,
									}))}
									{...searchForm.getInputProps('type')}
								/>
								<NumberInput
									label='Credits'
									min={0}
									step={0.5}
									decimalScale={1}
									{...searchForm.getInputProps('credits')}
								/>
								<MultiSelect
									label='Prerequisites'
									placeholder='Select prerequisites'
									data={prerequisiteOptions}
									searchable
									clearSearchOnChange={false}
									hidePickedOptions
									{...searchForm.getInputProps('prerequisiteCodes')}
								/>
								<Group justify='flex-end' mt='md'>
									<Button
										variant='light'
										color='gray'
										onClick={handleClose}
										disabled={addFromSearchMutation.isPending}
									>
										Cancel
									</Button>
									<Button
										type='submit'
										loading={addFromSearchMutation.isPending}
									>
										Add Module
									</Button>
								</Group>
							</Stack>
						</form>
					</Tabs.Panel>

					<Tabs.Panel value='create'>
						<form onSubmit={handleCreateSubmit}>
							<Stack gap='md'>
								<TextInput
									label='Code'
									placeholder='e.g., BBTY1212'
									{...createForm.getInputProps('code')}
									onChange={(e) => {
										createForm.setFieldValue('code', e.target.value);
										const code = e.target.value.trim();
										if (code.length >= 2) {
											const credits = extractCreditsFromCode(code);
											const type = getTypeFromCredits(credits);
											createForm.setFieldValue('credits', credits);
											createForm.setFieldValue('type', type);
										}
									}}
								/>
								<TextInput
									label='Name'
									placeholder='e.g., Introduction to Programming'
									{...createForm.getInputProps('name')}
								/>
								<Select
									label='Type'
									data={moduleType.enumValues.map((t) => ({
										value: t,
										label: t,
									}))}
									{...createForm.getInputProps('type')}
								/>
								<NumberInput
									label='Credits'
									min={0}
									step={0.5}
									decimalScale={1}
									{...createForm.getInputProps('credits')}
								/>
								<MultiSelect
									label='Prerequisites'
									placeholder='Select prerequisites'
									data={prerequisiteOptions}
									searchable
									clearSearchOnChange={false}
									hidePickedOptions
									{...createForm.getInputProps('prerequisiteCodes')}
								/>
								<Group justify='flex-end' mt='md'>
									<Button
										variant='light'
										color='gray'
										onClick={handleClose}
										disabled={createNewMutation.isPending}
									>
										Cancel
									</Button>
									<Button type='submit' loading={createNewMutation.isPending}>
										Create & Add Module
									</Button>
								</Group>
							</Stack>
						</form>
					</Tabs.Panel>
				</Tabs>
			</Modal>
		</>
	);
}
