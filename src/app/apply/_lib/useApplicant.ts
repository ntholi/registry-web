'use client';

import type { getApplicant } from '@admissions/applicants';
import {
	canCurrentUserApply,
	getOrCreateApplicantForCurrentUser,
} from '@admissions/applicants';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo } from 'react';

export type ApplicantWithRelations = NonNullable<
	Awaited<ReturnType<typeof getApplicant>>
>;

type CompletenessResult = {
	isComplete: boolean;
	hasIdentity: boolean;
	hasQualifications: boolean;
	hasFirstChoice: boolean;
	hasPersonalInfo: boolean;
};

type DocumentLimitsResult = {
	current: number;
	max: number;
	remaining: number;
	isAtLimit: boolean;
	isNearLimit: boolean;
};

function computeCompleteness(
	applicant: ApplicantWithRelations | null | undefined
): CompletenessResult {
	if (!applicant) {
		return {
			isComplete: false,
			hasIdentity: false,
			hasQualifications: false,
			hasFirstChoice: false,
			hasPersonalInfo: false,
		};
	}

	const hasIdentity = applicant.documents.some(
		(d) => d.document.type === 'identity'
	);

	const hasQualifications = applicant.academicRecords.length > 0;

	const application = applicant.applications.find(
		(app) => app.status === 'draft' || app.status === 'submitted'
	);
	const hasFirstChoice = !!application?.firstChoiceProgramId;

	const hasPersonalInfo =
		!!applicant.fullName && applicant.guardians.length > 0;

	const isComplete =
		hasIdentity && hasQualifications && hasFirstChoice && hasPersonalInfo;

	return {
		isComplete,
		hasIdentity,
		hasQualifications,
		hasFirstChoice,
		hasPersonalInfo,
	};
}

function computeDocumentLimits(
	applicant: ApplicantWithRelations | null | undefined,
	maxDocuments: number
): DocumentLimitsResult {
	if (!applicant) {
		return {
			current: 0,
			max: maxDocuments,
			remaining: maxDocuments,
			isAtLimit: false,
			isNearLimit: false,
		};
	}

	const current = applicant.documents.length + applicant.academicRecords.length;
	const remaining = Math.max(0, maxDocuments - current);
	const halfMax = Math.ceil(maxDocuments / 2);

	return {
		current,
		max: maxDocuments,
		remaining,
		isAtLimit: current >= maxDocuments,
		isNearLimit: current >= halfMax && current < maxDocuments,
	};
}

function computeNextStepUrl(
	applicant: ApplicantWithRelations | null | undefined,
	completeness: CompletenessResult,
	currentApplication: ApplicantWithRelations['applications'][number] | null
): string {
	if (!applicant || !currentApplication) {
		return '/apply/welcome';
	}

	if (currentApplication.status === 'submitted') {
		return '/apply/profile';
	}

	const { hasIdentity, hasQualifications, hasFirstChoice, hasPersonalInfo } =
		completeness;

	let step = 'documents';
	if (hasIdentity) step = 'qualifications';
	if (hasIdentity && hasQualifications) step = 'program';
	if (hasIdentity && hasQualifications && hasFirstChoice)
		step = 'personal-info';
	if (hasIdentity && hasQualifications && hasFirstChoice && hasPersonalInfo)
		step = 'review';

	return `/apply/${currentApplication.id}/${step}`;
}

export function useApplicant() {
	const { data: session } = useSession();
	const router = useRouter();
	const userId = session?.user?.id;

	const eligibilityQuery = useQuery({
		queryKey: ['applicant-eligibility', userId],
		queryFn: () => canCurrentUserApply(),
		staleTime: 60_000,
		enabled: !!userId,
	});

	useEffect(() => {
		if (eligibilityQuery.data && !eligibilityQuery.data.canApply) {
			router.replace('/apply/restricted');
		}
	}, [eligibilityQuery.data, router]);

	const query = useQuery({
		queryKey: ['applicant', 'user', userId],
		queryFn: () => getOrCreateApplicantForCurrentUser(),
		staleTime: 30_000,
		enabled: !!userId && eligibilityQuery.data?.canApply === true,
	});

	const completeness = useMemo(
		() => computeCompleteness(query.data),
		[query.data]
	);

	const currentApplication = useMemo(() => {
		if (!query.data) return null;
		return (
			query.data.applications.find(
				(app) => app.status === 'draft' || app.status === 'submitted'
			) ?? null
		);
	}, [query.data]);

	const activeIntake = query.data?.activeIntake ?? null;
	const maxDocuments =
		currentApplication?.intakePeriod?.maxDocuments ??
		activeIntake?.maxDocuments ??
		18;
	const certificationValidDays =
		currentApplication?.intakePeriod?.certificationValidDays ??
		activeIntake?.certificationValidDays ??
		undefined;

	const documentLimits = useMemo(
		() => computeDocumentLimits(query.data, maxDocuments),
		[query.data, maxDocuments]
	);

	const nextStepUrl = useMemo(
		() => computeNextStepUrl(query.data, completeness, currentApplication),
		[query.data, completeness, currentApplication]
	);

	return {
		applicant: query.data,
		isLoading: query.isLoading || eligibilityQuery.isLoading,
		isSuccess: query.isSuccess,
		error: query.error,
		refetch: query.refetch,
		completeness,
		currentApplication,
		activeIntake,
		documentLimits,
		certificationValidDays,
		nextStepUrl,
	};
}
