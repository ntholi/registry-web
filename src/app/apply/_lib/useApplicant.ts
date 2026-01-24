'use client';

import type { getApplicant } from '@admissions/applicants';
import { getOrCreateApplicantForCurrentUser } from '@admissions/applicants';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

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

export function useApplicant() {
	const { data: session } = useSession();
	const userId = session?.user?.id;

	const query = useQuery({
		queryKey: ['applicant', 'user', userId],
		queryFn: () => getOrCreateApplicantForCurrentUser(),
		staleTime: 30_000,
		enabled: !!userId,
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

	const maxDocuments = currentApplication?.intakePeriod?.maxDocuments ?? 18;

	const documentLimits = useMemo(
		() => computeDocumentLimits(query.data, maxDocuments),
		[query.data, maxDocuments]
	);

	return {
		applicant: query.data,
		isLoading: query.isLoading,
		isSuccess: query.isSuccess,
		error: query.error,
		refetch: query.refetch,
		completeness,
		currentApplication,
		documentLimits,
	};
}
