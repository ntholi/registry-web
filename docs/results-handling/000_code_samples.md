# Results Handling Migration Code Samples

> Comprehensive before-and-after examples for the migration described in `001` through `010`.

## Purpose

This document shows what the code should look like:

- before the migration
- during the compatibility phase
- after the final cleanup pass

The examples are representative rather than exact copies of a single file. They are based on the actual patterns called out across:

- academic
- registry
- admissions
- admin
- finance
- LMS
- library
- timetable
- apply
- reports

## Reading Guide

- `Before` means the old or inconsistent pattern that the migration is replacing.
- `After` means the target pattern once the relevant plan step is complete.
- `After (cleanup)` means the stricter end-state after `009_cleanup.md`.
- Positional list params stay as `(page, search)` throughout the migration.
- Repositories and services still throw. Actions normalize those failures into `ActionResult<T>`.

---

## 1. Shared Result Types

### 1.1 Minimal string-only result helper

### Before

```ts
export type ActionResult<T> =
	| { success: true; data: T }
	| { success: false; error: string };

export function success<T>(data: T): ActionResult<T> {
	return { success: true, data };
}

export function failure<T>(error: string): ActionResult<T> {
	return { success: false, error };
}
```

### After

```ts
export interface AppError {
	message: string;
	code?: string;
}

export type ActionResult<T> =
	| { success: true; data: T }
	| { success: false; error: AppError | string };

export function success<T>(data: T): ActionResult<T> {
	return { success: true, data };
}

export function failure<T>(error: AppError | string): ActionResult<T> {
	return { success: false, error };
}

export function getActionErrorMessage(error: AppError | string): string {
	return typeof error === 'string' ? error : error.message;
}
```

### After (cleanup)

```ts
export interface AppError {
	message: string;
	code?: string;
}

export type ActionResult<T> =
	| { success: true; data: T }
	| { success: false; error: AppError };

export function success<T>(data: T): ActionResult<T> {
	return { success: true, data };
}

export function failure<T>(error: AppError): ActionResult<T> {
	return { success: false, error };
}

export function getActionErrorMessage(error: AppError): string {
	return error.message;
}
```

### 1.2 Centralized action wrapper

### Before

```ts
export async function createDepartment(data: DepartmentInput) {
	try {
		const item = await departmentService.create(data);
		return success(item);
	} catch (error) {
		return failure('Failed to create department');
	}
}
```

### After

```ts
import { createServiceLogger } from '@/core/platform/logger';
import { extractError, isNextNavigationError } from './extractError';

const actionLogger = createServiceLogger('ServerAction');

export function createAction<TArgs extends unknown[], TOutput>(
	fn: (...args: TArgs) => Promise<TOutput>
): (...args: TArgs) => Promise<ActionResult<TOutput>> {
	return async (...args) => {
		try {
			return success(await fn(...args));
		} catch (error) {
			if (isNextNavigationError(error)) {
				throw error;
			}

			actionLogger.error('Action failed', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});

			return failure<TOutput>(extractError(error));
		}
	};
}
```

### 1.3 Unwrapping inside server components and cross-action flows

### Before

```ts
const term = await getActiveTerm();
const student = await getStudent(stdNo);
```

### After

```ts
import { unwrap } from '@/shared/lib/actions/actionResult';

const term = unwrap(await getActiveTerm());
const student = unwrap(await getStudent(stdNo));
```

---

## 2. Error Extraction

### 2.1 Local ad hoc error mapping

### Before

```ts
export function extractErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		if (error.message.includes('duplicate key')) {
			return 'Duplicate record';
		}

		return error.message;
	}

	return 'Something went wrong';
}
```

### After

```ts
export class UserFacingError extends Error {
	constructor(message: string, public code?: string) {
		super(message);
		this.name = 'UserFacingError';
	}
}

export function extractError(error: unknown): AppError {
	if (error instanceof UserFacingError) {
		return {
			message: error.message,
			code: error.code,
		};
	}

	if (isPostgresError(error) && error.code === '23505') {
		return {
			message: 'A record with this value already exists',
			code: 'UNIQUE_VIOLATION',
		};
	}

	if (isMoodleError(error)) {
		return {
			message: 'An error occurred communicating with the LMS. Please try again.',
			code: 'MOODLE_ERROR',
		};
	}

	if (error instanceof Error && error.message.includes('ETIMEDOUT')) {
		return {
			message: 'Service temporarily unavailable. Please try again.',
			code: 'SERVICE_UNAVAILABLE',
		};
	}

	return {
		message: 'An unexpected error occurred',
	};
}
```

### 2.2 Preserving meaningful domain messages

### Before

```ts
export async function publishTerm(code: string) {
	const term = await termsRepository.findById(code);
	if (!term) {
		throw new Error('Term not found');
	}

	if (term.isPublished) {
		throw new Error('Already published');
	}

	return termsRepository.publish(code);
}
```

### After

```ts
import { UserFacingError } from '@/shared/lib/actions/extractError';

export async function publishTerm(code: string) {
	const term = await termsRepository.findById(code);
	if (!term) {
		throw new UserFacingError('Term not found', 'TERM_NOT_FOUND');
	}

	if (term.isPublished) {
		throw new UserFacingError('This term is already published', 'TERM_PUBLISHED');
	}

	return termsRepository.publish(code);
}
```

---

## 3. Simple Server Actions

### 3.1 Query action returning raw data

### Before

```ts
'use server';

export async function getSchool(id: string) {
	return schoolsService.get(id);
}
```

### After

```ts
'use server';

import { createAction } from '@/shared/lib/actions/actionResult';

export const getSchool = createAction(async (id: string) => schoolsService.get(id));
```

### 3.2 Paginated query action keeping positional params

### Before

```ts
'use server';

export async function findAllSchools(page: number, search: string) {
	return schoolsService.findAll({ page, search });
}
```

### After

```ts
'use server';

import { createAction } from '@/shared/lib/actions/actionResult';

export const findAllSchools = createAction(
	async (page: number, search: string) =>
		schoolsService.findAll({ page, search })
);
```

### 3.3 Mutation with revalidation

### Before

```ts
'use server';

import { revalidatePath } from 'next/cache';

export async function createSchool(data: SchoolInput) {
	const item = await schoolsService.create(data);
	revalidatePath('/academic/schools');
	return item;
}
```

### After

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { createAction } from '@/shared/lib/actions/actionResult';

export const createSchool = createAction(async (data: SchoolInput) => {
	const item = await schoolsService.create(data);
	revalidatePath('/academic/schools');
	return item;
});
```

### 3.4 Delete mutation returning void

### Before

```ts
'use server';

export async function deleteSchool(id: string) {
	await schoolsService.delete(id);
}
```

### After

```ts
'use server';

import { createAction } from '@/shared/lib/actions/actionResult';

export const deleteSchool = createAction(async (id: string) => {
	await schoolsService.delete(id);
});
```

---

## 4. Manual ActionResult Actions

### 4.1 Old hand-written success and failure responses

### Before

```ts
'use server';

import { failure, success, type ActionResult } from '@/shared/lib/actions/actionResult';

export async function createCertificateType(
	data: CertificateTypeInput
): Promise<ActionResult<CertificateType>> {
	const result = await certificateTypesService.create(data);
	if (!result) {
		return failure('Failed to create certificate type');
	}

	return success(result);
}
```

### After

```ts
'use server';

import { createAction } from '@/shared/lib/actions/actionResult';
import { UserFacingError } from '@/shared/lib/actions/extractError';

export const createCertificateType = createAction(
	async (data: CertificateTypeInput) => {
		const result = await certificateTypesService.create(data);
		if (!result) {
			throw new UserFacingError(
				'Failed to create certificate type',
				'CERTIFICATE_TYPE_CREATE_FAILED'
			);
		}

		return result;
	}
);
```

### 4.2 Old manual try/catch in apply wizard

### Before

```ts
'use server';

import { extractError } from '@/app/apply/_lib/errors';
import { type ActionResult } from '@/shared/lib/actions/actionResult';

export async function submitApplication(
	applicationId: string
): Promise<ActionResult<void>> {
	try {
		await changeApplicationStatus(applicationId, 'submitted');
		return { success: true, data: undefined };
	} catch (error) {
		return { success: false, error: extractError(error) };
	}
}
```

### After

```ts
'use server';

import { createAction, unwrap } from '@/shared/lib/actions/actionResult';

export const submitApplication = createAction(async (applicationId: string) => {
	unwrap(await changeApplicationStatus(applicationId, 'submitted'));
});
```

### 4.3 Apply module no longer depends on local errors wrapper

### Before

```ts
import { extractError, type ActionResult } from '../../_lib/errors';
```

### After

```ts
import { createAction, type ActionResult } from '@/shared/lib/actions/actionResult';
```

### After (cleanup)

```ts
import { createAction } from '@/shared/lib/actions/actionResult';
```

---

## 5. Cross-Action Calls

### 5.1 Calling another action before migration

### Before

```ts
'use server';

export async function createAssessmentFromQuiz(input: QuizInput) {
	const term = await getActiveTerm();
	const assessment = await createAssessment({
		termCode: term.code,
		title: input.title,
		weight: input.weight,
	});

	return quizzesService.linkAssessment(input.quizId, assessment.id);
}
```

### After

```ts
'use server';

import { createAction, unwrap } from '@/shared/lib/actions/actionResult';

export const createAssessmentFromQuiz = createAction(async (input: QuizInput) => {
	const term = unwrap(await getActiveTerm());
	const assessment = unwrap(
		await createAssessment({
			termCode: term.code,
			title: input.title,
			weight: input.weight,
		})
	);

	return quizzesService.linkAssessment(input.quizId, assessment.id);
});
```

### 5.2 Cross-action call with nullable follow-up fetch

### Before

```ts
export async function updateApplicantFromIdentity(
	applicantId: string,
	data: ExtractedIdentityData
) {
	const applicant = await getApplicant(applicantId);
	if (!applicant) {
		return failure('Applicant not found');
	}

	await updateApplicant(applicantId, {
		fullName: data.fullName,
	});

	const refreshed = await getApplicant(applicantId);
	if (!refreshed) {
		return failure('Applicant not found');
	}

	return success(refreshed);
}
```

### After

```ts
import { createAction, unwrap } from '@/shared/lib/actions/actionResult';
import { UserFacingError } from '@/shared/lib/actions/extractError';

export const updateApplicantFromIdentity = createAction(
	async (applicantId: string, data: ExtractedIdentityData) => {
		const applicant = unwrap(await getApplicant(applicantId));
		if (!applicant) {
			throw new UserFacingError('Applicant not found', 'APPLICANT_NOT_FOUND');
		}

		unwrap(
			await updateApplicant(applicantId, {
				fullName: data.fullName,
			})
		);

		const refreshed = unwrap(await getApplicant(applicantId));
		if (!refreshed) {
			throw new UserFacingError('Applicant not found', 'APPLICANT_NOT_FOUND');
		}

		return refreshed;
	}
);
```

### 5.3 Query action used inside another query action

### Before

```ts
export async function getGraduationReport(filters: Filters) {
	const sponsors = await getAllSponsors();
	return reportsService.getGraduationReport(filters, sponsors);
}
```

### After

```ts
import { createAction, unwrap } from '@/shared/lib/actions/actionResult';

export const getGraduationReport = createAction(async (filters: Filters) => {
	const sponsors = unwrap(await getAllSponsors());
	return reportsService.getGraduationReport(filters, sponsors);
});
```

---

## 6. Server Component Pages

### 6.1 Detail page loading a single entity

### Before

```tsx
import { notFound } from 'next/navigation';
import { getModule } from '../_server/actions';

export default async function ModulePage({ params }: Props) {
	const { id } = await params;
	const moduleItem = await getModule(id);

	if (!moduleItem) {
		notFound();
	}

	return <ModuleDetails item={moduleItem} />;
}
```

### After

```tsx
import { notFound } from 'next/navigation';
import { unwrap } from '@/shared/lib/actions/actionResult';
import { getModule } from '../_server/actions';

export default async function ModulePage({ params }: Props) {
	const { id } = await params;
	const moduleItem = unwrap(await getModule(id));

	if (!moduleItem) {
		notFound();
	}

	return <ModuleDetails item={moduleItem} />;
}
```

### 6.2 Edit page loading multiple resources

### Before

```tsx
import { getAssessment } from '../../_server/actions';
import { getActiveTerm } from '@/app/registry/terms/_server/actions';

export default async function EditAssessmentPage({ params }: Props) {
	const { id } = await params;
	const assessment = await getAssessment(id);
	const term = await getActiveTerm();

	if (!assessment) {
		notFound();
	}

	return <AssessmentForm defaultValues={assessment} term={term} />;
}
```

### After

```tsx
import { notFound } from 'next/navigation';
import { unwrap } from '@/shared/lib/actions/actionResult';
import { getAssessment } from '../../_server/actions';
import { getActiveTerm } from '@/app/registry/terms/_server/actions';

export default async function EditAssessmentPage({ params }: Props) {
	const { id } = await params;
	const assessment = unwrap(await getAssessment(id));
	const term = unwrap(await getActiveTerm());

	if (!assessment) {
		notFound();
	}

	return <AssessmentForm defaultValues={assessment} term={term} />;
}
```

### 6.3 Page that passes actions as props but does not await them

### Before

```tsx
export default function NewSchoolPage() {
	return <SchoolForm action={createSchool} queryKey={['schools']} />;
}
```

### After

```tsx
export default function NewSchoolPage() {
	return <SchoolForm action={createSchool} queryKey={['schools']} />;
}
```

This is intentionally unchanged. Only direct `await action(...)` calls need `unwrap()`.

---

## 7. ListLayout Callers

### 7.1 Direct action reference

### Before

```tsx
import { findAllSchools } from './_server/actions';

export default function Layout({ children }: Props) {
	return (
		<ListLayout
			getData={findAllSchools}
			renderItem={(item) => <SchoolListItem item={item} />}
			path="/academic/schools"
			queryKey={['schools']}
		>
			{children}
		</ListLayout>
	);
}
```

### After

```tsx
import { findAllSchools } from './_server/actions';

export default function Layout({ children }: Props) {
	return (
		<ListLayout
			getData={findAllSchools}
			renderItem={(item) => <SchoolListItem item={item} />}
			path="/academic/schools"
			queryKey={['schools']}
		>
			{children}
		</ListLayout>
	);
}
```

The layout stays the same. The action return type changes, and `ListLayout` adapts.

### 7.2 Wrapper function that keeps positional params

### Before

```tsx
export default function Layout({ children }: Props) {
	return (
		<ListLayout
			getData={(page, search) =>
				findAllApplications(page, search, selectedStatus)
			}
			renderItem={(item) => <ApplicationListItem item={item} />}
			path="/admissions/applications"
			queryKey={['applications', selectedStatus]}
		>
			{children}
		</ListLayout>
	);
}
```

### After

```tsx
export default function Layout({ children }: Props) {
	return (
		<ListLayout
			getData={(page, search) =>
				findAllApplications(page, search, selectedStatus)
			}
			renderItem={(item) => <ApplicationListItem item={item} />}
			path="/admissions/applications"
			queryKey={['applications', selectedStatus]}
		>
			{children}
		</ListLayout>
	);
}
```

Again, the caller usually does not change unless it manually inspects the action result.

### 7.3 Internal `ListLayout` query function

### Before

```tsx
const { isLoading, data } = useQuery({
	queryKey: [...queryKey, page, search],
	queryFn: () => getData(page, search),
});
```

### After

```tsx
const {
	isLoading,
	isError,
	refetch,
	data: { items, totalPages, totalItems } = {
		items: [],
		totalPages: 0,
		totalItems: 0,
	},
} = useQuery({
	queryKey: [...queryKey, page, search],
	queryFn: async () => {
		const result = await getData(page, search);
		if (isActionResult(result)) {
			if (!result.success) {
				throw new Error(getActionErrorMessage(result.error));
			}

			return result.data;
		}

		return result;
	},
	staleTime: 0,
});
```

### 7.4 `ListLayout` error state

### Before

```tsx
{isLoading ? (
	<SchoolListSkeleton />
) : (
	items.map((item) => renderItem(item))
)}
```

### After

```tsx
{isError ? (
	<Center py="xl">
		<Stack align="center" gap="sm">
			<ThemeIcon size={48} radius="xl" variant="light" color="red">
				<IconAlertTriangle size={24} />
			</ThemeIcon>
			<Text c="dimmed" size="sm">
				Failed to load data
			</Text>
			<Button size="xs" variant="light" onClick={() => refetch()}>
				Retry
			</Button>
		</Stack>
	</Center>
) : isLoading ? (
	<SchoolListSkeleton />
) : (
	items.map((item) => renderItem(item))
)}
```

---

## 8. Form and Mutation Flows

### 8.1 Form component already hiding most migration complexity

### Before

```tsx
type FormProps<T, R = T> = {
	action: (values: T) => Promise<R>;
	onSuccess?: (values: R) => void;
	onError?: (error: Error) => void;
};

const mutation = useMutation({
	mutationFn: action,
	onSuccess: (data) => {
		onSuccess?.(data);
	},
});
```

### After

```tsx
type FormProps<T, R = T> = {
	action: (values: T) => Promise<R | ActionResult<R>>;
	onSuccess?: (values: R) => void;
	onError?: (error: Error) => void;
};

const mutation = useMutation({
	mutationFn: action,
	onSuccess: (data) => {
		if (isActionResult(data)) {
			if (!data.success) {
				notifications.show({
					title: 'Error',
					message: getActionErrorMessage(data.error),
					color: 'red',
				});
				return;
			}

			onSuccess?.(data.data);
			return;
		}

		onSuccess?.(data);
	},
});
```

### 8.2 Client component using `useMutation` directly

### Before

```tsx
'use client';

import { useMutation } from '@tanstack/react-query';
import { updateQuestion } from '../_server/actions';

export function EditQuestionModal() {
	const mutation = useMutation({
		mutationFn: updateQuestion,
		onSuccess: (data) => {
			notifications.show({
				title: 'Saved',
				message: `Updated ${data.title}`,
			});
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});
}
```

### After

```tsx
'use client';

import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import { updateQuestion } from '../_server/actions';

export function EditQuestionModal() {
	const mutation = useActionMutation(updateQuestion, {
		onSuccess: (data) => {
			notifications.show({
				title: 'Saved',
				message: `Updated ${data.title}`,
			});
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});
}
```

### 8.3 Shared hook that restores normal mutation ergonomics

### Before

```tsx
const mutation = useMutation({
	mutationFn: updateAssignment,
	onSuccess: (data) => {
		console.log(data);
	},
});
```

### After

```ts
'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import {
	type ActionResult,
	getActionErrorMessage,
} from '@/shared/lib/actions/actionResult';

export function useActionMutation<TData, TVariables = void>(
	action: (variables: TVariables) => Promise<ActionResult<TData>>,
	options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>
) {
	return useMutation<TData, Error, TVariables>({
		mutationFn: async (variables) => {
			const result = await action(variables);
			if (!result.success) {
				throw new Error(getActionErrorMessage(result.error));
			}

			return result.data;
		},
		...options,
	});
}
```

---

## 9. Delete Flows

### 9.1 Delete button expecting only thrown errors

### Before

```tsx
type DeleteButtonProps = {
	handleDelete: () => Promise<void>;
};

const mutation = useMutation({
	mutationFn: handleDelete,
	onSuccess: async () => {
		notifications.show({
			title: 'Success',
			message: 'Deleted successfully',
		});
	},
});
```

### After

```tsx
type DeleteButtonProps = {
	handleDelete: () => Promise<void | ActionResult<unknown>>;
};

const mutation = useMutation({
	mutationFn: handleDelete,
	onSuccess: async (data) => {
		if (isActionResult(data)) {
			if (!data.success) {
				notifications.show({
					title: 'Error',
					message: getActionErrorMessage(data.error),
					color: 'red',
				});
				return;
			}
		}

		notifications.show({
			title: 'Success',
			message: 'Deleted successfully',
		});
	},
});
```

### 9.2 Details header passthrough type

### Before

```tsx
type DetailsViewHeaderProps = {
	handleDelete?: () => Promise<void>;
};
```

### After

```tsx
type DetailsViewHeaderProps = {
	handleDelete?: () => Promise<void | ActionResult<unknown>>;
};
```

---

## 10. Error Boundaries and Retry UI

### 10.1 Status page without retry affordance

### Before

```tsx
type StatusPageProps = {
	title: string;
	description: string;
	icon: ReactNode;
	showBack?: boolean;
};
```

### After

```tsx
type StatusPageProps = {
	title: string;
	description: string;
	icon: ReactNode;
	showBack?: boolean;
	onRetry?: () => void;
};
```

### 10.2 Route-level error boundary

### Before

```tsx
export default function ErrorPage({ error }: { error: Error }) {
	return <div>{error.message}</div>;
}
```

### After

```tsx
'use client';

import { IconAlertTriangle } from '@tabler/icons-react';
import StatusPage from '@/shared/ui/StatusPage';

export default function ErrorPage({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<StatusPage
			title="Something went wrong"
			description="An unexpected error occurred. Please try again."
			color="red"
			icon={<IconAlertTriangle size={32} />}
			showBack
			onRetry={reset}
		/>
	);
}
```

### 10.3 Global error boundary

### Before

```tsx
export default function GlobalError({ error }: { error: Error }) {
	return <div>{error.message}</div>;
}
```

### After

```tsx
'use client';

import '@mantine/core/styles.css';

import {
	Button,
	Center,
	Container,
	Group,
	MantineProvider,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { IconAlertTriangle, IconArrowLeft } from '@tabler/icons-react';

export default function GlobalError({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="en">
			<body>
				<MantineProvider defaultColorScheme="dark">
					<Center h="100dvh">
						<Container size="xs">
							<Stack align="center" gap="md">
								<ThemeIcon size={64} radius="xl" variant="light" color="red">
									<IconAlertTriangle size={32} />
								</ThemeIcon>
								<Title order={1} ta="center" size="h2">
									Something went wrong
								</Title>
								<Text c="dimmed" ta="center">
									An unexpected error occurred. Please try again.
								</Text>
								<Group mt="sm">
									<Button
										variant="light"
										color="red"
										leftSection={<IconArrowLeft size="1.2rem" />}
										onClick={() => window.location.reload()}
									>
										Reload page
									</Button>
									<Button color="red" onClick={reset}>
										Try again
									</Button>
								</Group>
							</Stack>
						</Container>
					</Center>
				</MantineProvider>
			</body>
		</html>
	);
}
```

---

## 11. Next.js Sentinel Errors

### 11.1 Wrapper that accidentally swallows redirects and authorization failures

### Before

```ts
export async function getProtectedData() {
	try {
		return await protectedService.getData();
	} catch {
		return failure('Unable to load data');
	}
}
```

If `protectedService.getData()` triggers `redirect()`, `notFound()`, `unauthorized()`, or `forbidden()`, the old pattern can swallow it.

### After

```ts
export function createAction<TArgs extends unknown[], TOutput>(
	fn: (...args: TArgs) => Promise<TOutput>
): (...args: TArgs) => Promise<ActionResult<TOutput>> {
	return async (...args) => {
		try {
			return success(await fn(...args));
		} catch (error) {
			if (isNextNavigationError(error)) {
				throw error;
			}

			return failure(extractError(error));
		}
	};
}
```

---

## 12. End-State Cleanup Examples

### 12.1 Removing compatibility unions

### Before

```ts
export type ActionResult<T> =
	| { success: true; data: T }
	| { success: false; error: AppError | string };

export function getActionErrorMessage(error: AppError | string): string {
	return typeof error === 'string' ? error : error.message;
}
```

### After (cleanup)

```ts
export type ActionResult<T> =
	| { success: true; data: T }
	| { success: false; error: AppError };

export function getActionErrorMessage(error: AppError): string {
	return error.message;
}
```

### 12.2 Removing remaining string failures

### Before

```ts
if (!record) {
	return failure('Record not found');
}
```

### After (cleanup)

```ts
if (!record) {
	return failure({
		message: 'Record not found',
		code: 'RECORD_NOT_FOUND',
	});
}
```

### 12.3 Final unwrap stays the same

### Before

```ts
export function unwrap<T>(result: ActionResult<T>): T {
	if (!result.success) {
		throw new UserFacingError(getActionErrorMessage(result.error));
	}

	return result.data;
}
```

### After (cleanup)

```ts
export function unwrap<T>(result: ActionResult<T>): T {
	if (!result.success) {
		throw new UserFacingError(result.error.message, result.error.code);
	}

	return result.data;
}
```

---

## 13. Full Vertical Slice Examples

### 13.1 Standard CRUD feature

### Before

```ts
'use server';

export async function getLecturer(id: string) {
	return lecturersService.get(id);
}

export async function createLecturer(data: LecturerInput) {
	const item = await lecturersService.create(data);
	revalidatePath('/academic/lecturers');
	return item;
}

export async function findAllLecturers(page: number, search: string) {
	return lecturersService.findAll({ page, search });
}
```

```tsx
import { getLecturer } from '../_server/actions';

export default async function LecturerPage({ params }: Props) {
	const { id } = await params;
	const lecturer = await getLecturer(id);

	if (!lecturer) {
		notFound();
	}

	return <LecturerDetails lecturer={lecturer} />;
}
```

```tsx
<ListLayout
	getData={findAllLecturers}
	renderItem={(item) => <LecturerListItem item={item} />}
	path="/academic/lecturers"
	queryKey={['lecturers']}
>
	{children}
</ListLayout>
```

### After

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { createAction } from '@/shared/lib/actions/actionResult';

export const getLecturer = createAction(async (id: string) => lecturersService.get(id));

export const createLecturer = createAction(async (data: LecturerInput) => {
	const item = await lecturersService.create(data);
	revalidatePath('/academic/lecturers');
	return item;
});

export const findAllLecturers = createAction(
	async (page: number, search: string) =>
		lecturersService.findAll({ page, search })
);
```

```tsx
import { notFound } from 'next/navigation';
import { unwrap } from '@/shared/lib/actions/actionResult';
import { getLecturer } from '../_server/actions';

export default async function LecturerPage({ params }: Props) {
	const { id } = await params;
	const lecturer = unwrap(await getLecturer(id));

	if (!lecturer) {
		notFound();
	}

	return <LecturerDetails lecturer={lecturer} />;
}
```

```tsx
<ListLayout
	getData={findAllLecturers}
	renderItem={(item) => <LecturerListItem item={item} />}
	path="/academic/lecturers"
	queryKey={['lecturers']}
>
	{children}
</ListLayout>
```

### 13.2 Apply wizard step with cross-action calls

### Before

```ts
'use server';

import { extractError } from '@/app/apply/_lib/errors';
import { type ActionResult } from '@/shared/lib/actions/actionResult';

export async function saveProgramSelection(
	applicationId: string,
	programId: string
): Promise<ActionResult<void>> {
	try {
		const intake = await findActiveIntakePeriod();
		const openProgramIds = await getOpenProgramIds();

		if (!openProgramIds.includes(programId)) {
			return {
				success: false,
				error: 'Selected program is no longer open',
			};
		}

		await applicationsService.updateProgram(applicationId, {
			programId,
			intakePeriodId: intake.id,
		});

		return {
			success: true,
			data: undefined,
		};
	} catch (error) {
		return {
			success: false,
			error: extractError(error),
		};
	}
}
```

### After

```ts
'use server';

import { createAction, unwrap } from '@/shared/lib/actions/actionResult';
import { UserFacingError } from '@/shared/lib/actions/extractError';

export const saveProgramSelection = createAction(
	async (applicationId: string, programId: string) => {
		const intake = unwrap(await findActiveIntakePeriod());
		const openProgramIds = unwrap(await getOpenProgramIds());

		if (!openProgramIds.includes(programId)) {
			throw new UserFacingError(
				'Selected program is no longer open',
				'PROGRAM_CLOSED'
			);
		}

		await applicationsService.updateProgram(applicationId, {
			programId,
			intakePeriodId: intake.id,
		});
	}
);
```

### 13.3 Report page and report action

### Before

```ts
'use server';

export async function getAttendanceReport(filters: AttendanceFilters) {
	return attendanceReportService.get(filters);
}
```

```tsx
import { getAttendanceReport } from './_server/actions';

export default async function AttendancePage({ searchParams }: Props) {
	const params = await searchParams;
	const report = await getAttendanceReport({
		termCode: params.termCode,
	});

	return <AttendanceReportView data={report} />;
}
```

### After

```ts
'use server';

import { createAction } from '@/shared/lib/actions/actionResult';

export const getAttendanceReport = createAction(
	async (filters: AttendanceFilters) => attendanceReportService.get(filters)
);
```

```tsx
import { unwrap } from '@/shared/lib/actions/actionResult';
import { getAttendanceReport } from './_server/actions';

export default async function AttendancePage({ searchParams }: Props) {
	const params = await searchParams;
	const report = unwrap(
		await getAttendanceReport({
			termCode: params.termCode,
		})
	);

	return <AttendanceReportView data={report} />;
}
```

---

## 14. Final Picture

After the migration, the standard flow everywhere becomes:

```ts
DB -> Repository (throws) -> Service (throws or UserFacingError) -> Action (createAction) -> ActionResult<T> -> UI or RSC
```

### Final action shape

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { createAction, unwrap } from '@/shared/lib/actions/actionResult';
import { UserFacingError } from '@/shared/lib/actions/extractError';

export const updateSemesterModule = createAction(
	async (id: string, data: SemesterModuleInput) => {
		const term = unwrap(await getActiveTerm());
		if (!term.isActive) {
			throw new UserFacingError('There is no active term', 'NO_ACTIVE_TERM');
		}

		const item = await semesterModulesService.update(id, data);
		revalidatePath('/academic/semester-modules');
		return item;
	}
);
```

### Final RSC shape

```tsx
import { notFound } from 'next/navigation';
import { unwrap } from '@/shared/lib/actions/actionResult';
import { getSemesterModule } from '../_server/actions';

export default async function SemesterModulePage({ params }: Props) {
	const { id } = await params;
	const item = unwrap(await getSemesterModule(id));

	if (!item) {
		notFound();
	}

	return <SemesterModuleDetails item={item} />;
}
```

### Final client mutation shape

```tsx
'use client';

import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import { updateSemesterModule } from '../_server/actions';

export function EditSemesterModuleModal() {
	const mutation = useActionMutation(updateSemesterModule, {
		onSuccess: (data) => {
			notifications.show({
				title: 'Saved',
				message: `${data.name} updated successfully`,
			});
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	return null;
}
```

This is the end-state the rest of the migration docs are describing.

---

## 11. Service-Level Action Import Fix

### 11.1 Service calling an action (architecture violation)

Services must NOT import actions — this breaks when actions are wrapped with `createAction` (return type changes from `T` to `ActionResult<T>`).

### Before

```ts
// In a service file — WRONG
import { getActiveTerm } from '@/app/registry/terms';

export class AttendanceService {
	async getAttendanceForUser(userId: string) {
		const term = await getActiveTerm(); // calling an action from a service
		return this.repo.findByUserAndTerm(userId, term.id);
	}
}
```

### After

```ts
// In a service file — CORRECT
import { termsService } from '@registry/terms/_server/service';

export class AttendanceService {
	async getAttendanceForUser(userId: string) {
		const term = await termsService.getActiveOrThrow(); // service calls service
		return this.repo.findByUserAndTerm(userId, term.id);
	}
}
```

### The service method added to support this

```ts
// In termsService
import { UserFacingError } from '@/shared/lib/actions/extractError';

async getActiveOrThrow() {
	const term = await this.getActive();
	if (!term) throw new UserFacingError('No active term', 'NO_ACTIVE_TERM');
	return term;
}
```

### The action wraps the same logic

```ts
// In actions.ts
export const getActiveTerm = createAction(async () => {
	const term = await service.getActive();
	if (!term) throw new UserFacingError('No active term', 'NO_ACTIVE_TERM');
	return term;
});
```