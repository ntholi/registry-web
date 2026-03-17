'use client';

import { Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { pdf } from '@react-pdf/renderer';
import { IconFileTypePdf } from '@tabler/icons-react';
import { useState } from 'react';
import { getObservation } from '@/app/appraisals/teaching-observations/_server/actions';
import ObservationPDF, { type ObservationPDFData } from './ObservationPDF';

type Props = {
	observationId: string;
};

export default function PdfExportButton({ observationId }: Props) {
	const [loading, setLoading] = useState(false);

	async function handleExport() {
		setLoading(true);
		try {
			const obs = await getObservation(observationId);
			if (!obs) throw new Error('Observation not found');

			const am = obs.assignedModule;
			const sm = am.semesterModule;

			const data: ObservationPDFData = {
				lecturerName: am.user.name ?? 'Unknown',
				schoolName: sm.semester?.structure?.program?.name ?? '',
				programName: sm.semester?.structure?.program?.code ?? '',
				termName: obs.cycle?.name ?? '',
				moduleCode: sm.module?.code ?? '',
				moduleName: sm.module?.name ?? '',
				observerName: obs.observer?.name ?? 'Unknown',
				status: obs.status,
				strengths: obs.strengths,
				improvements: obs.improvements,
				recommendations: obs.recommendations,
				trainingArea: obs.trainingArea,
				submittedAt: obs.submittedAt?.toISOString() ?? null,
				acknowledgedAt: obs.acknowledgedAt?.toISOString() ?? null,
				acknowledgmentComment: obs.acknowledgmentComment,
				ratings: obs.ratings.map((r) => ({
					criterionText: r.criterion.text,
					categoryName: r.criterion.category.name,
					section: r.criterion.category.section,
					rating: r.rating,
				})),
			};

			const blob = await pdf(<ObservationPDF data={data} />).toBlob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `PRL-Report-${data.lecturerName.replace(/\s+/g, '-')}-${data.moduleCode}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

			notifications.show({
				title: 'Success',
				message: 'PRL Report exported successfully',
				color: 'green',
			});
		} catch {
			notifications.show({
				title: 'Error',
				message: 'Failed to export PRL report',
				color: 'red',
			});
		} finally {
			setLoading(false);
		}
	}

	return (
		<Button
			leftSection={<IconFileTypePdf size={16} />}
			variant='light'
			color='red'
			loading={loading}
			onClick={handleExport}
		>
			Export PDF
		</Button>
	);
}
