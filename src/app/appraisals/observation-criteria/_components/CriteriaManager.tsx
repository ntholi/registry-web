'use client';

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
	Accordion,
	ActionIcon,
	Badge,
	Box,
	Button,
	Card,
	Divider,
	Flex,
	Group,
	Loader,
	Modal,
	Paper,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
	IconGripVertical,
	IconPencil,
	IconPlus,
	IconSearch,
} from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { hasAnyPermission } from '@/core/auth/sessionPermissions';
import { authClient } from '@/core/auth-client';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import { DeleteButton } from '@/shared/ui/adease';
import {
	createCategory,
	createCriterion,
	deleteCategory,
	deleteCriterion,
	getCategoriesWithCriteria,
	reorderCategories,
	reorderCriteria,
	updateCategory,
	updateCriterion,
} from '../_server/actions';
import CategoryForm from './CategoryForm';
import CriterionForm from './CriterionForm';

const QUERY_KEY = ['observation-criteria-board'];

const SECTION_LABELS: Record<string, string> = {
	teaching_observation: 'Section 1: Teaching Observation',
	assessments: 'Section 2: Assessments',
	other: 'Section 3: Other',
};

const SECTION_ORDER = ['teaching_observation', 'assessments', 'other'];

type CategoryBoard = Awaited<
	ReturnType<typeof getCategoriesWithCriteria>
>[number];

function useCanManage() {
	const { data: session } = authClient.useSession();
	return (
		session?.user?.role === 'admin' ||
		hasAnyPermission(session, 'teaching-observation-criteria', [
			'create',
			'update',
			'delete',
		])
	);
}

export default function CriteriaManager() {
	const [search, setSearch] = useState('');
	const canManage = useCanManage();

	const { data: board = [], isLoading } = useQuery({
		queryKey: QUERY_KEY,
		queryFn: () => getCategoriesWithCriteria(),
	});

	const grouped = useMemo(() => {
		const searchValue = search.trim().toLowerCase();

		const sections: Record<string, CategoryBoard[]> = {};
		for (const section of SECTION_ORDER) {
			sections[section] = [];
		}

		for (const cat of board) {
			if (!sections[cat.section]) {
				sections[cat.section] = [];
			}

			if (!searchValue) {
				sections[cat.section].push(cat);
				continue;
			}

			const catMatch = cat.name.toLowerCase().includes(searchValue);
			if (catMatch) {
				sections[cat.section].push(cat);
				continue;
			}

			const filtered = cat.criteria.filter(
				(c) =>
					c.text.toLowerCase().includes(searchValue) ||
					c.description?.toLowerCase().includes(searchValue)
			);
			if (filtered.length > 0) {
				sections[cat.section].push({
					...cat,
					criteria: filtered,
					criteriaCount: filtered.length,
				});
			}
		}

		return sections;
	}, [board, search]);

	if (isLoading) {
		return (
			<Flex justify='center' align='center' mih={300}>
				<Loader />
			</Flex>
		);
	}

	const isSearching = search.trim().length > 0;

	return (
		<Stack gap='lg'>
			<Group justify='space-between'>
				<TextInput
					placeholder='Search categories or criteria...'
					leftSection={<IconSearch size={16} />}
					value={search}
					onChange={(e) => setSearch(e.currentTarget.value)}
					w={300}
				/>
				{canManage && <CreateCategoryModal />}
			</Group>

			<Accordion variant='separated' multiple defaultValue={SECTION_ORDER}>
				{SECTION_ORDER.map((section) => {
					const cats = grouped[section] ?? [];
					return (
						<Accordion.Item key={section} value={section}>
							<Accordion.Control>
								<Group gap='sm'>
									<Text fw={600}>{SECTION_LABELS[section]}</Text>
									<Badge size='sm' variant='light'>
										{cats.length}
									</Badge>
								</Group>
							</Accordion.Control>
							<Accordion.Panel>
								{cats.length === 0 ? (
									<Text size='sm' c='dimmed'>
										No categories in this section.
									</Text>
								) : isSearching || !canManage ? (
									<Stack gap='md'>
										{cats.map((cat) => (
											<CategoryGroup
												key={cat.id}
												group={cat}
												canManage={canManage}
											/>
										))}
									</Stack>
								) : (
									<SortableCategoryList
										categories={cats}
										section={section}
										canManage={canManage}
									/>
								)}
							</Accordion.Panel>
						</Accordion.Item>
					);
				})}
			</Accordion>
		</Stack>
	);
}

type SortableCategoryListProps = {
	categories: CategoryBoard[];
	section: string;
	canManage: boolean;
};

function SortableCategoryList({
	categories,
	canManage,
}: SortableCategoryListProps) {
	const queryClient = useQueryClient();
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
	);

	const reorderMut = useActionMutation(reorderCategories, {
		onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
	});

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIdx = categories.findIndex((c) => c.id === active.id);
		const newIdx = categories.findIndex((c) => c.id === over.id);
		const reordered = arrayMove(categories, oldIdx, newIdx);
		reorderMut.mutate(reordered.map((c) => c.id));
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<SortableContext
				items={categories.map((c) => c.id)}
				strategy={verticalListSortingStrategy}
			>
				<Stack gap='md'>
					{categories.map((cat) => (
						<SortableCategoryGroup
							key={cat.id}
							group={cat}
							canManage={canManage}
						/>
					))}
				</Stack>
			</SortableContext>
		</DndContext>
	);
}

type CategoryGroupProps = {
	group: CategoryBoard;
	canManage: boolean;
	dragListeners?: ReturnType<typeof useSortable>['listeners'];
};

function SortableCategoryGroup({
	group,
	canManage,
}: Omit<CategoryGroupProps, 'dragListeners'>) {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id: group.id });

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div ref={setNodeRef} style={style} {...attributes}>
			<CategoryGroup
				group={group}
				canManage={canManage}
				dragListeners={listeners}
			/>
		</div>
	);
}

function CategoryGroup({
	group,
	canManage,
	dragListeners,
}: CategoryGroupProps) {
	const queryClient = useQueryClient();
	const hasCriteria = group.criteriaCount > 0;

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
	);

	const reorderMut = useActionMutation(reorderCriteria, {
		onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
	});

	function handleCriteriaDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIdx = group.criteria.findIndex((c) => c.id === active.id);
		const newIdx = group.criteria.findIndex((c) => c.id === over.id);
		const reordered = arrayMove(group.criteria, oldIdx, newIdx);
		reorderMut.mutate(reordered.map((c) => c.id));
	}

	return (
		<Paper withBorder radius='md' p='md'>
			<Group justify='space-between' align='center' mb='sm'>
				<Group gap='xs'>
					{dragListeners && (
						<ActionIcon
							variant='subtle'
							color='gray'
							size='sm'
							style={{ cursor: 'grab' }}
							{...dragListeners}
						>
							<IconGripVertical size={16} />
						</ActionIcon>
					)}
					<Text fw={600}>{group.name}</Text>
					{canManage && (
						<EditCategoryModal
							category={{
								id: group.id,
								name: group.name,
								section: group.section,
								sortOrder: group.sortOrder,
							}}
						/>
					)}
				</Group>
				{canManage && (
					<Group gap='xs' wrap='nowrap'>
						<CreateCriterionModal
							categoryId={group.id}
							categoryName={group.name}
						/>
						<DeleteButton
							size='sm'
							typedConfirmation={false}
							disabled={hasCriteria}
							handleDelete={async () => {
								await deleteCategory(group.id);
							}}
							queryKey={QUERY_KEY}
							itemName={group.name}
							itemType='category'
							onSuccess={() => {
								notifications.show({
									title: 'Category Deleted',
									message: 'The category has been removed',
									color: 'red',
								});
							}}
						/>
					</Group>
				)}
			</Group>
			<Divider mb='sm' />
			<Stack gap='xs'>
				{group.criteria.length === 0 ? (
					<Text size='sm' c='dimmed'>
						No criteria in this category yet.
					</Text>
				) : canManage ? (
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleCriteriaDragEnd}
					>
						<SortableContext
							items={group.criteria.map((c) => c.id)}
							strategy={verticalListSortingStrategy}
						>
							{group.criteria.map((c) => (
								<SortableCriterionCard key={c.id} criterion={c} canManage />
							))}
						</SortableContext>
					</DndContext>
				) : (
					group.criteria.map((c) => <CriterionCard key={c.id} criterion={c} />)
				)}
			</Stack>
		</Paper>
	);
}

type CriterionData = CategoryBoard['criteria'][number];

type CriterionCardProps = {
	criterion: CriterionData;
	canManage?: boolean;
};

function SortableCriterionCard({ criterion, canManage }: CriterionCardProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: criterion.id });

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<Card
			ref={setNodeRef}
			style={style}
			withBorder
			padding='sm'
			radius='md'
			{...attributes}
		>
			<Group justify='space-between' wrap='nowrap' align='flex-start'>
				<Group gap='xs' wrap='nowrap' style={{ flex: 1 }}>
					<ActionIcon
						variant='subtle'
						color='gray'
						size='sm'
						style={{ cursor: 'grab' }}
						{...listeners}
					>
						<IconGripVertical size={16} />
					</ActionIcon>
					<Box style={{ flex: 1 }}>
						<Text size='sm'>{criterion.text}</Text>
						{criterion.description && (
							<Text size='xs' c='dimmed' mt={2}>
								{criterion.description}
							</Text>
						)}
					</Box>
				</Group>
				{canManage && (
					<Group gap='xs' wrap='nowrap'>
						<EditCriterionModal criterion={criterion} />
						<DeleteButton
							size='sm'
							typedConfirmation={false}
							handleDelete={async () => {
								await deleteCriterion(criterion.id);
							}}
							queryKey={QUERY_KEY}
							itemName={criterion.text}
							itemType='criterion'
							onSuccess={() => {
								notifications.show({
									title: 'Criterion Deleted',
									message: 'The criterion has been removed',
									color: 'red',
								});
							}}
						/>
					</Group>
				)}
			</Group>
		</Card>
	);
}

function CriterionCard({ criterion }: CriterionCardProps) {
	return (
		<Card withBorder padding='sm' radius='md'>
			<Box>
				<Text size='sm'>{criterion.text}</Text>
				{criterion.description && (
					<Text size='xs' c='dimmed' mt={2}>
						{criterion.description}
					</Text>
				)}
			</Box>
		</Card>
	);
}

function CreateCategoryModal() {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const mutation = useActionMutation(createCategory, {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
			notifications.show({
				title: 'Category Created',
				message: 'The category has been added',
				color: 'green',
			});
			close();
		},
	});

	return (
		<>
			<Button
				variant='default'
				leftSection={<IconPlus size={16} />}
				onClick={open}
			>
				Add Category
			</Button>
			<Modal opened={opened} onClose={close} title='New Category' size='md'>
				<CategoryForm
					onSubmit={(v) => mutation.mutate(v)}
					loading={mutation.isPending}
					submitLabel='Create'
					onCancel={close}
				/>
			</Modal>
		</>
	);
}

type Section = 'teaching_observation' | 'assessments' | 'other';

type EditCategoryModalProps = {
	category: {
		id: string;
		name: string;
		section: Section;
		sortOrder: number;
	};
};

function EditCategoryModal({ category }: EditCategoryModalProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const mutation = useActionMutation(
		(values: { name: string; section: Section; sortOrder: number }) =>
			updateCategory(category.id, values),
		{
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: QUERY_KEY });
				notifications.show({
					title: 'Category Updated',
					message: 'The category has been updated',
					color: 'green',
				});
				close();
			},
		}
	);

	return (
		<>
			<ActionIcon variant='subtle' color='gray' size='sm' onClick={open}>
				<IconPencil size={14} />
			</ActionIcon>
			<Modal opened={opened} onClose={close} title='Edit Category' size='md'>
				<CategoryForm
					initialValues={{
						name: category.name,
						section: category.section,
						sortOrder: category.sortOrder,
					}}
					onSubmit={(v) => mutation.mutate(v)}
					loading={mutation.isPending}
					submitLabel='Save'
					onCancel={close}
				/>
			</Modal>
		</>
	);
}

type CreateCriterionModalProps = {
	categoryId: string;
	categoryName: string;
};

function CreateCriterionModal({
	categoryId,
	categoryName,
}: CreateCriterionModalProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const mutation = useActionMutation(createCriterion, {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
			notifications.show({
				title: 'Criterion Created',
				message: 'The criterion has been added',
				color: 'green',
			});
			close();
		},
	});

	return (
		<>
			<Button
				variant='subtle'
				size='compact-sm'
				leftSection={<IconPlus size={14} />}
				onClick={open}
			>
				Add Criterion
			</Button>
			<Modal
				opened={opened}
				onClose={close}
				title={`New Criterion — ${categoryName}`}
				size='md'
			>
				<CriterionForm
					onSubmit={(v) => mutation.mutate({ ...v, categoryId })}
					loading={mutation.isPending}
					submitLabel='Create'
					onCancel={close}
				/>
			</Modal>
		</>
	);
}

type EditCriterionModalProps = {
	criterion: CriterionData;
};

function EditCriterionModal({ criterion }: EditCriterionModalProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const mutation = useActionMutation(
		(values: { text: string; description: string }) =>
			updateCriterion(criterion.id, values),
		{
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: QUERY_KEY });
				notifications.show({
					title: 'Criterion Updated',
					message: 'The criterion has been updated',
					color: 'green',
				});
				close();
			},
		}
	);

	return (
		<>
			<ActionIcon variant='subtle' color='gray' size='sm' onClick={open}>
				<IconPencil size={14} />
			</ActionIcon>
			<Modal opened={opened} onClose={close} title='Edit Criterion' size='md'>
				<CriterionForm
					initialValues={{
						text: criterion.text,
						description: criterion.description ?? '',
					}}
					onSubmit={(v) => mutation.mutate(v)}
					loading={mutation.isPending}
					submitLabel='Save'
					onCancel={close}
				/>
			</Modal>
		</>
	);
}
