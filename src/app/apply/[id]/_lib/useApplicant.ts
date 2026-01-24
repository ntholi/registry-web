'use client';

import { getApplicant } from '@admissions/applicants';
import { useQuery } from '@tanstack/react-query';
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

export function useApplicant(applicantId: string) {
	const query = useQuery({
		queryKey: ['applicant', applicantId],
		queryFn: () => getApplicant(applicantId),
		staleTime: 30_000,
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

	return {
		applicant: query.data,
		isLoading: query.isLoading,
		isSuccess: query.isSuccess,
		error: query.error,
		refetch: query.refetch,
		completeness,
		currentApplication,
	};
}
