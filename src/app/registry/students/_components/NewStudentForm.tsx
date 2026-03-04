'use client';

import { getAllSchools, getProgramsBySchoolId } from '@academic/schools';
import { getStructuresByProgramId } from '@academic/structures';
import {
	ActionIcon,
	Button,
	Divider,
	Flex,
	Group,
	Loader,
	Select,
	SimpleGrid,
	Stack,
	Stepper,
	Table,
	Text,
	TextInput,
	Title,
	Tooltip,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
	gender,
	maritalStatusEnum,
	nextOfKinRelationship,
	programStatus,
} from '@registry/_database';
import {
	IconArrowLeft,
	IconArrowRight,
	IconDeviceFloppy,
	IconPencil,
	IconPlus,
	IconSchool,
	IconTrash,
	IconUser,
	IconUsers,
} from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useMemo, useState } from 'react';
import { getAllTerms } from '@/app/registry/terms';
import { useActiveTerm } from '@/shared/lib/hooks/use-active-term';
import { getRaceByCountry, getRaces } from '@/shared/lib/utils/countries';
import { formatDateToISO } from '@/shared/lib/utils/dates';
import { getReligions } from '@/shared/lib/utils/religions';
import CountrySelect from '@/shared/ui/CountrySelect';
import {
	type CreateFullStudentInput,
	createFullStudent,
} from '../_server/actions';
import ImportStudentsModal from './import/ImportStudentsModal';

interface NextOfKinEntry {
	name: string;
	relationship: string;
	phone: string;
	email: string;
	occupation: string;
	address: string;
	country: string;
}

interface FormValues {
	name: string;
	nationalId: string;
	dateOfBirth: Date | null;
	phone1: string;
	phone2: string;
	gender: string;
	maritalStatus: string;
	country: string;
	nationality: string;
	birthPlace: string;
	religion: string;
	race: string;
	nextOfKins: NextOfKinEntry[];
	schoolId: string;
	programId: string;
	structureId: string;
	intakeDate: Date | null;
	regDate: Date | null;
	startTerm: string;
	programStatus: string;
}

const EMPTY_KIN: NextOfKinEntry = {
	name: '',
	relationship: '',
	phone: '',
	email: '',
	occupation: '',
	address: '',
	country: '',
};

export default function NewStudentForm() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [active, setActive] = useState(0);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { activeTerm } = useActiveTerm();
	const [termDefaultSet, setTermDefaultSet] = useState(false);

	const form = useForm<FormValues>({
		initialValues: {
			name: '',
			nationalId: '',
			dateOfBirth: null,
			phone1: '',
			phone2: '',
			gender: '',
			maritalStatus: '',
			country: 'Lesotho',
			nationality: 'Mosotho',
			birthPlace: '',
			religion: '',
			race: '',
			nextOfKins: [],
			schoolId: '',
			programId: '',
			structureId: '',
			intakeDate: new Date(),
			regDate: new Date(),
			startTerm: '',
			programStatus: 'Active',
		},
		validate: (values) => {
			if (active === 0) {
				return {
					name: !values.name.trim() ? 'Name is required' : null,
					nationalId: !values.nationalId.trim()
						? 'National ID is required'
						: null,
					gender: !values.gender ? 'Gender is required' : null,
				};
			}
			if (active === 2) {
				return {
					structureId: !values.structureId ? 'Structure is required' : null,
					programStatus: !values.programStatus
						? 'Program status is required'
						: null,
				};
			}
			return {};
		},
	});

	if (activeTerm?.code && !termDefaultSet) {
		form.setFieldValue('startTerm', activeTerm.code);
		setTermDefaultSet(true);
	}

	const selectedSchoolId = useMemo(() => {
		const val = Number(form.values.schoolId);
		return Number.isFinite(val) && val > 0 ? val : null;
	}, [form.values.schoolId]);

	const selectedProgramId = useMemo(() => {
		const val = Number(form.values.programId);
		return Number.isFinite(val) && val > 0 ? val : null;
	}, [form.values.programId]);

	const { data: schoolsData = [], isLoading: isLoadingSchools } = useQuery({
		queryKey: ['schools'],
		queryFn: getAllSchools,
		select: (data) =>
			data.map((s) => ({ value: s.id.toString(), label: s.name })),
	});

	const { data: programsData = [], isLoading: isLoadingPrograms } = useQuery({
		queryKey: ['programs', selectedSchoolId],
		queryFn: () =>
			selectedSchoolId ? getProgramsBySchoolId(selectedSchoolId) : [],
		enabled: !!selectedSchoolId,
		select: (data) =>
			data.map((p) => ({ value: p.id.toString(), label: p.name })),
	});

	const { data: structuresData = [], isLoading: isLoadingStructures } =
		useQuery({
			queryKey: ['structures', selectedProgramId],
			queryFn: () =>
				selectedProgramId ? getStructuresByProgramId(selectedProgramId) : [],
			enabled: !!selectedProgramId,
			select: (data) =>
				data.map((s) => ({ value: s.id.toString(), label: s.code })),
		});

	const { data: termsData = [] } = useQuery({
		queryKey: ['terms'],
		queryFn: getAllTerms,
		select: (data) => data.map((t) => ({ value: t.code, label: t.code })),
	});

	function handleNext() {
		if (form.validate().hasErrors) return;
		setActive((c) => Math.min(c + 1, 2));
	}

	function handleBack() {
		setActive((c) => Math.max(c - 1, 0));
	}

	async function handleSubmit() {
		if (form.validate().hasErrors) return;

		setIsSubmitting(true);
		try {
			const v = form.values;
			const input: CreateFullStudentInput = {
				student: {
					name: v.name,
					nationalId: v.nationalId,
					dateOfBirth: v.dateOfBirth ?? undefined,
					phone1: v.phone1 || null,
					phone2: v.phone2 || null,
					gender: (v.gender as (typeof gender.enumValues)[number]) || null,
					maritalStatus:
						(v.maritalStatus as (typeof maritalStatusEnum.enumValues)[number]) ||
						null,
					country: v.country || null,
					nationality: v.nationality || null,
					birthPlace: v.birthPlace || null,
					religion: v.religion || null,
					race: v.race || null,
					status: 'Active',
				},
				nextOfKins: v.nextOfKins
					.filter((k) => k.name.trim() && k.relationship)
					.map((k) => ({
						name: k.name,
						relationship:
							k.relationship as (typeof nextOfKinRelationship.enumValues)[number],
						phone: k.phone || null,
						email: k.email || null,
						occupation: k.occupation || null,
						address: k.address || null,
						country: k.country || null,
					})),
				program: {
					structureId: Number(v.structureId),
					status:
						(v.programStatus as (typeof programStatus.enumValues)[number]) ||
						'Active',
					intakeDate: formatDateToISO(v.intakeDate) || null,
					regDate: formatDateToISO(v.regDate) || null,
					startTerm: v.startTerm || null,
					stream: null,
				},
			};

			const created = await createFullStudent(input);
			notifications.show({
				title: 'Success',
				message: `Student ${created.stdNo} created successfully`,
				color: 'green',
			});
			queryClient.invalidateQueries({ queryKey: ['students'] });
			router.push(`/registry/students/${created.stdNo}`);
		} catch (error) {
			notifications.show({
				title: 'Error',
				message: `Failed to create student: ${error}`,
				color: 'red',
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Stack p='xl'>
			<Flex align='center' justify='space-between' gap='md'>
				<Title order={4}>Create New Student</Title>
				<ImportStudentsModal />
			</Flex>
			<Divider />
			<Stepper
				active={active}
				onStepClick={setActive}
				size='sm'
				allowNextStepsSelect={false}
			>
				<Stepper.Step label='Personal Info' icon={<IconUser size='1.1rem' />}>
					<PersonalInfoStep form={form} />
				</Stepper.Step>
				<Stepper.Step label='Next of Kin' icon={<IconUsers size='1.1rem' />}>
					<NextOfKinStep form={form} />
				</Stepper.Step>
				<Stepper.Step label='Program' icon={<IconSchool size='1.1rem' />}>
					<ProgramStep
						form={form}
						schoolsData={schoolsData}
						programsData={programsData}
						structuresData={structuresData}
						termsData={termsData}
						isLoadingSchools={isLoadingSchools}
						isLoadingPrograms={isLoadingPrograms}
						isLoadingStructures={isLoadingStructures}
						queryClient={queryClient}
					/>
				</Stepper.Step>
			</Stepper>
			<Group justify='space-between' mt='md'>
				{active > 0 ? (
					<Button
						variant='default'
						leftSection={<IconArrowLeft size='1rem' />}
						onClick={handleBack}
					>
						Back
					</Button>
				) : (
					<div />
				)}
				{active < 2 ? (
					<Button
						rightSection={<IconArrowRight size='1rem' />}
						onClick={handleNext}
					>
						Next
					</Button>
				) : (
					<Button
						leftSection={<IconDeviceFloppy size='1rem' />}
						loading={isSubmitting}
						onClick={handleSubmit}
					>
						Create Student
					</Button>
				)}
			</Group>
		</Stack>
	);
}

type StepForm = ReturnType<typeof useForm<FormValues>>;

type PersonalInfoProps = {
	form: StepForm;
};

function PersonalInfoStep({ form }: PersonalInfoProps) {
	return (
		<Stack mt='md'>
			<SimpleGrid cols={{ base: 1, sm: 2 }}>
				<TextInput label='Full Name' required {...form.getInputProps('name')} />
				<TextInput
					label='National ID'
					placeholder='e.g. 1234567890'
					required
					{...form.getInputProps('nationalId')}
				/>
			</SimpleGrid>
			<SimpleGrid cols={{ base: 1, sm: 3 }}>
				<DateInput
					label='Date of Birth'
					placeholder='Select date'
					clearable
					maxDate={new Date()}
					{...form.getInputProps('dateOfBirth')}
				/>
				<Select
					label='Gender'
					placeholder='Select gender'
					required
					data={gender.enumValues}
					{...form.getInputProps('gender')}
				/>
				<Select
					label='Marital Status'
					placeholder='Select status'
					data={maritalStatusEnum.enumValues}
					clearable
					{...form.getInputProps('maritalStatus')}
				/>
			</SimpleGrid>
			<Divider label='Contact Information' labelPosition='left' />
			<SimpleGrid cols={{ base: 1, sm: 2 }}>
				<TextInput
					label='Phone 1'
					placeholder='e.g. +266 5800 0000'
					{...form.getInputProps('phone1')}
				/>
				<TextInput
					label='Phone 2'
					placeholder='e.g. +266 2200 0000'
					{...form.getInputProps('phone2')}
				/>
			</SimpleGrid>
			<Divider label='Background' labelPosition='left' />
			<SimpleGrid cols={{ base: 1, sm: 2 }}>
				<CountrySelect
					label='Country'
					placeholder='Select country'
					{...form.getInputProps('country')}
					onCountryChange={(c) => {
						if (c) {
							form.setFieldValue('nationality', c.nationality);
							const race = getRaceByCountry(c.name);
							if (race) form.setFieldValue('race', race);
						}
					}}
				/>
				<TextInput
					label='Nationality'
					placeholder='e.g. Mosotho'
					{...form.getInputProps('nationality')}
				/>
			</SimpleGrid>
			<SimpleGrid cols={{ base: 1, sm: 3 }}>
				<TextInput
					label='Birth Place'
					placeholder='e.g. Maseru'
					{...form.getInputProps('birthPlace')}
				/>
				<Select
					label='Religion'
					placeholder='e.g. Christianity'
					data={getReligions()}
					searchable
					clearable
					{...form.getInputProps('religion')}
				/>
				<Select
					label='Race'
					placeholder='Select race'
					data={getRaces()}
					searchable
					clearable
					{...form.getInputProps('race')}
				/>
			</SimpleGrid>
		</Stack>
	);
}

type NextOfKinProps = {
	form: StepForm;
};

function NextOfKinStep({ form }: NextOfKinProps) {
	const [draft, setDraft] = useState<NextOfKinEntry>({ ...EMPTY_KIN });
	const [editIndex, setEditIndex] = useState<number | null>(null);

	function updateDraft(field: keyof NextOfKinEntry, value: string) {
		setDraft((prev) => ({ ...prev, [field]: value }));
	}

	function resetDraft() {
		setDraft({ ...EMPTY_KIN });
		setEditIndex(null);
	}

	function handleAddOrSave() {
		if (!draft.name.trim() || !draft.relationship) return;
		if (editIndex !== null) {
			form.setFieldValue(`nextOfKins.${editIndex}`, { ...draft });
		} else {
			form.insertListItem('nextOfKins', { ...draft });
		}
		resetDraft();
	}

	function handleEdit(index: number) {
		setDraft({ ...form.values.nextOfKins[index] });
		setEditIndex(index);
	}

	function handleDelete(index: number) {
		form.removeListItem('nextOfKins', index);
		if (editIndex === index) resetDraft();
		else if (editIndex !== null && index < editIndex)
			setEditIndex(editIndex - 1);
	}

	return (
		<Stack mt='md'>
			<SimpleGrid cols={{ base: 1, sm: 2 }}>
				<TextInput
					label='Full Name'
					value={draft.name}
					onChange={(e) => updateDraft('name', e.currentTarget.value)}
				/>
				<Select
					label='Relationship'
					placeholder='Select relationship'
					data={nextOfKinRelationship.enumValues}
					value={draft.relationship || null}
					onChange={(v) => updateDraft('relationship', v || '')}
				/>
			</SimpleGrid>
			<SimpleGrid cols={{ base: 1, sm: 2 }}>
				<TextInput
					label='Phone'
					placeholder='e.g. +266 5800 0000'
					value={draft.phone}
					onChange={(e) => updateDraft('phone', e.currentTarget.value)}
				/>
				<TextInput
					label='Email'
					placeholder='e.g. jane@example.com'
					value={draft.email}
					onChange={(e) => updateDraft('email', e.currentTarget.value)}
				/>
			</SimpleGrid>
			<SimpleGrid cols={{ base: 1, sm: 3 }}>
				<TextInput
					label='Occupation'
					placeholder='e.g. Teacher'
					value={draft.occupation}
					onChange={(e) => updateDraft('occupation', e.currentTarget.value)}
				/>
				<TextInput
					label='Address'
					placeholder='e.g. Maseru, Lesotho'
					value={draft.address}
					onChange={(e) => updateDraft('address', e.currentTarget.value)}
				/>
				<CountrySelect
					label='Country'
					placeholder='Select country'
					value={draft.country || null}
					onChange={(v) => updateDraft('country', v || '')}
				/>
			</SimpleGrid>
			<Group justify='flex-end'>
				{editIndex !== null && (
					<Button variant='default' onClick={resetDraft}>
						Cancel
					</Button>
				)}
				<Button
					leftSection={
						editIndex !== null ? (
							<IconDeviceFloppy size='1rem' />
						) : (
							<IconPlus size='1rem' />
						)
					}
					onClick={handleAddOrSave}
					disabled={!draft.name.trim() || !draft.relationship}
				>
					{editIndex !== null ? 'Save' : 'Add'}
				</Button>
			</Group>
			{form.values.nextOfKins.length > 0 && (
				<Table striped highlightOnHover withTableBorder>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Name</Table.Th>
							<Table.Th>Relationship</Table.Th>
							<Table.Th>Phone</Table.Th>
							<Table.Th>Email</Table.Th>
							<Table.Th w={80} />
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{form.values.nextOfKins.map((kin, i) => (
							<Table.Tr key={i}>
								<Table.Td>{kin.name}</Table.Td>
								<Table.Td>{kin.relationship}</Table.Td>
								<Table.Td>{kin.phone}</Table.Td>
								<Table.Td>{kin.email}</Table.Td>
								<Table.Td>
									<Group gap='xs' wrap='nowrap'>
										<Tooltip label='Edit'>
											<ActionIcon
												variant='subtle'
												size='sm'
												onClick={() => handleEdit(i)}
											>
												<IconPencil size='1rem' />
											</ActionIcon>
										</Tooltip>
										<Tooltip label='Delete'>
											<ActionIcon
												variant='subtle'
												color='red'
												size='sm'
												onClick={() => handleDelete(i)}
											>
												<IconTrash size='1rem' />
											</ActionIcon>
										</Tooltip>
									</Group>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			)}
			{form.values.nextOfKins.length === 0 && (
				<Text c='dimmed' ta='center' size='sm' py='lg'>
					No next of kin added yet. Fill in the form above and click Add.
				</Text>
			)}
		</Stack>
	);
}

type ProgramStepProps = {
	form: StepForm;
	schoolsData: { value: string; label: string }[];
	programsData: { value: string; label: string }[];
	structuresData: { value: string; label: string }[];
	termsData: { value: string; label: string }[];
	isLoadingSchools: boolean;
	isLoadingPrograms: boolean;
	isLoadingStructures: boolean;
	queryClient: ReturnType<typeof useQueryClient>;
};

function ProgramStep({
	form,
	schoolsData,
	programsData,
	structuresData,
	termsData,
	isLoadingSchools,
	isLoadingPrograms,
	isLoadingStructures,
	queryClient,
}: ProgramStepProps) {
	return (
		<Stack mt='md'>
			<SimpleGrid cols={{ base: 1, sm: 2 }}>
				<Select
					label='School'
					placeholder='Select school'
					searchable
					clearable
					data={schoolsData}
					disabled={isLoadingSchools}
					{...form.getInputProps('schoolId')}
					onChange={(value) => {
						form.setFieldValue('schoolId', value || '');
						form.setFieldValue('programId', '');
						form.setFieldValue('structureId', '');
					}}
					rightSection={isLoadingSchools ? <Loader size='xs' /> : undefined}
				/>
				<Select
					label='Program'
					placeholder='Select program'
					searchable
					clearable
					data={programsData}
					disabled={!form.values.schoolId || isLoadingPrograms}
					{...form.getInputProps('programId')}
					onChange={(value) => {
						form.setFieldValue('programId', value || '');
						form.setFieldValue('structureId', '');
						const programId = value ? Number(value) : null;
						if (!programId) return;
						void queryClient
							.fetchQuery({
								queryKey: ['structures', programId],
								queryFn: () => getStructuresByProgramId(programId),
							})
							.then((structures) => {
								const latest = structures.at(-1);
								if (latest?.id) {
									form.setFieldValue('structureId', latest.id.toString());
								}
							});
					}}
					rightSection={isLoadingPrograms ? <Loader size='xs' /> : undefined}
				/>
			</SimpleGrid>
			<SimpleGrid cols={{ base: 1, sm: 2 }}>
				<Select
					label='Structure'
					placeholder='Select structure'
					searchable
					clearable
					required
					data={structuresData}
					disabled={!form.values.programId || isLoadingStructures}
					{...form.getInputProps('structureId')}
					rightSection={isLoadingStructures ? <Loader size='xs' /> : undefined}
				/>
				<Select
					label='Program Status'
					placeholder='Select status'
					required
					data={programStatus.enumValues}
					{...form.getInputProps('programStatus')}
				/>
			</SimpleGrid>
			<Divider label='Enrollment Details' labelPosition='left' />
			<SimpleGrid cols={{ base: 1, sm: 3 }}>
				<DateInput
					label='Intake Date'
					placeholder='Select date'
					clearable
					{...form.getInputProps('intakeDate')}
				/>
				<DateInput
					label='Registration Date'
					placeholder='Select date'
					clearable
					{...form.getInputProps('regDate')}
				/>
				<Select
					label='Start Term'
					placeholder='Select term'
					searchable
					clearable
					data={termsData}
					{...form.getInputProps('startTerm')}
				/>
			</SimpleGrid>
		</Stack>
	);
}
