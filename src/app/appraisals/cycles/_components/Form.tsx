'use client';

import { feedbackCycles } from '@appraisals/_database';
import {
	Button,
	Group,
	Modal,
	MultiSelect,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useQuery } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { useRef, useState } from 'react';
import { authClient } from '@/core/auth-client';
import type { ActionResult } from '@/shared/lib/actions/actionResult';
import {
	formatDate,
	formatDateToISO,
	formatMonthYear,
} from '@/shared/lib/utils/dates';
import { Form } from '@/shared/ui/adease';
import TermInput from '@/shared/ui/TermInput';
import {
	getLatestRelevantCycle,
	getSchools,
	getSchoolsForUser,
	getTerms,
} from '../_server/actions';

type Cycle = typeof feedbackCycles.$inferInsert;
type CycleWithSchools = Cycle & { schoolIds?: number[] };

interface RecentCycle {
	id: string;
	name: string;
	startDate: string;
	endDate: string;
	schoolCodes: string[];
}

type Props = {
	onSubmit: (values: CycleWithSchools) => Promise<Cycle | ActionResult<Cycle>>;
	defaultValues?: CycleWithSchools;
	title?: string;
};

const defaultName = formatMonthYear(new Date());

function getCycleWarningKey(values: CycleWithSchools) {
	const termId = Number(values.termId);
	if (!termId) return '';
	const schoolIds = [
		...new Set((values.schoolIds ?? []).filter((id) => id > 0)),
	]
		.sort((left, right) => left - right)
		.join(',');
	return `${termId}:${schoolIds}`;
}

function getCycleSchoolsLabel(cycle: RecentCycle) {
	if (cycle.schoolCodes.length === 0) return 'No schools assigned';
	return cycle.schoolCodes.join(', ');
}

function getDateValue(value: string) {
	const [year, month, day] = value.split('-').map(Number);
	return Date.UTC(year, (month ?? 1) - 1, day ?? 1);
}

function getDaysLeft(startDate: string, endDate: string) {
	const diff = getDateValue(endDate) - getDateValue(startDate);
	return Math.round(diff / 86400000);
}

function getDaysLeftLabel(days: number) {
	if (days === 0)
		return "The latest relevant cycle ends on this cycle's start date.";
	const unit = days === 1 ? 'day' : 'days';
	return `The latest relevant cycle still has ${days} ${unit} left when this cycle starts.`;
}

export default function CycleForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const formRef = useRef<HTMLFormElement | null>(null);
	const approvedKeyRef = useRef('');
	const [pendingKey, setPendingKey] = useState('');
	const [pendingStartDate, setPendingStartDate] = useState('');
	const [recentCycle, setRecentCycle] = useState<RecentCycle | null>(null);
	const values = defaultValues ?? ({ name: defaultName } as Cycle);
	const { data: terms = [] } = useQuery({
		queryKey: ['terms'],
		queryFn: () => getTerms(),
	});
	const { data: schools = [] } = useQuery({
		queryKey: ['schools'],
		queryFn: () => getSchools(),
	});
	const { data: userSchools, isLoading: loadingUserSchools } = useQuery({
		queryKey: ['user-schools', session?.user?.id],
		queryFn: () => getSchoolsForUser(session?.user?.id),
		enabled: !!session?.user?.id,
	});

	const defaultSchoolIds = defaultValues?.schoolIds
		? defaultValues.schoolIds.map(String)
		: userSchools
			? userSchools.map((us: { schoolId: number }) => String(us.schoolId))
			: [];

	const formKey = defaultValues ? undefined : defaultSchoolIds.join(',');

	if (!defaultValues && loadingUserSchools) return null;

	async function handleBeforeSubmit(form: { values: CycleWithSchools }) {
		if (defaultValues) return true;
		const termId = Number(form.values.termId);
		if (!termId) return true;
		const startDate = form.values.startDate;
		if (!startDate) return true;
		const schoolIds = [
			...new Set((form.values.schoolIds ?? []).filter((id) => id > 0)),
		];
		const key = getCycleWarningKey(form.values);
		if (approvedKeyRef.current === key) return true;
		const cycle = (await getLatestRelevantCycle(
			termId,
			schoolIds,
			startDate
		)) as RecentCycle | null;
		if (!cycle) return true;
		setPendingKey(key);
		setPendingStartDate(startDate);
		setRecentCycle(cycle);
		return false;
	}

	function closeRecentCycleModal() {
		setRecentCycle(null);
	}

	function continueWithNewCycle() {
		approvedKeyRef.current = pendingKey;
		setRecentCycle(null);
		queueMicrotask(() => {
			formRef.current?.requestSubmit();
		});
	}

	const daysLeft = recentCycle
		? getDaysLeft(pendingStartDate, recentCycle.endDate)
		: 0;

	return (
		<>
			<Form
				key={formKey}
				formRef={formRef}
				title={title}
				action={onSubmit}
				queryKey={['feedback-cycles']}
				schema={createInsertSchema(feedbackCycles)}
				defaultValues={{ ...values, schoolIds: defaultSchoolIds.map(Number) }}
				beforeSubmit={handleBeforeSubmit}
				onSuccess={({ id }) => {
					router.push(`/appraisals/cycles/${id}`);
				}}
			>
				{(form) => (
					<>
						<TextInput label='Name' {...form.getInputProps('name')} />
						<TermInput
							terms={terms}
							value={form.values.termId}
							onChange={(value) =>
								form.setFieldValue(
									'termId',
									typeof value === 'number' ? value : (null as never)
								)
							}
							error={form.errors.termId}
						/>

						<SimpleGrid cols={{ base: 1, sm: 2 }}>
							<DateInput
								label='Start Date'
								value={form.values.startDate}
								onChange={(date) =>
									form.setFieldValue('startDate', formatDateToISO(date))
								}
								error={form.errors.startDate}
							/>
							<DateInput
								label='End Date'
								value={form.values.endDate}
								onChange={(date) =>
									form.setFieldValue('endDate', formatDateToISO(date))
								}
								error={form.errors.endDate}
							/>
						</SimpleGrid>
						<MultiSelect
							label='Schools'
							data={schools.map((s) => ({
								value: String(s.id),
								label: s.name,
							}))}
							value={
								form.values.schoolIds
									? (form.values.schoolIds as number[]).map(String)
									: []
							}
							onChange={(vals) =>
								form.setFieldValue(
									'schoolIds' as never,
									vals.map(Number) as never
								)
							}
							searchable
							clearable
						/>
					</>
				)}
			</Form>

			<Modal
				opened={!!recentCycle}
				onClose={closeRecentCycleModal}
				title='Recent Feedback Cycle Found'
				centered
			>
				{recentCycle && (
					<Stack gap='md'>
						<Text size='sm'>
							{getDaysLeftLabel(daysLeft)} You can use the latest relevant cycle
							instead or continue anyway.
						</Text>
						<Stack gap={4}>
							<Text size='sm' fw={600}>
								{recentCycle.name}
							</Text>
							<Text size='sm' c='dimmed'>
								Dates: {formatDate(recentCycle.startDate)} to{' '}
								{formatDate(recentCycle.endDate)}
							</Text>
							<Text size='sm' c='dimmed'>
								Schools: {getCycleSchoolsLabel(recentCycle)}
							</Text>
						</Stack>
						<Group justify='flex-end' gap='sm'>
							<Button
								variant='light'
								color='red'
								onClick={continueWithNewCycle}
							>
								Continue Anyway
							</Button>
							<Button
								onClick={() => {
									setRecentCycle(null);
									router.push(`/appraisals/cycles/${recentCycle.id}`);
								}}
							>
								Use Existing Cycle
							</Button>
						</Group>
					</Stack>
				)}
			</Modal>
		</>
	);
}
