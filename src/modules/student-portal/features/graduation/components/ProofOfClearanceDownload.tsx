'use client';

import { ActionIcon } from '@mantine/core';
import { pdf } from '@react-pdf/renderer';
import { getGraduationClearanceData } from '@registry/graduation/clearance';
import { getClearanceStatus } from '@student-portal/utils/status';
import { IconDownload } from '@tabler/icons-react';
import { useState } from 'react';
import ProofOfClearancePDF from './ProofOfClearancePDF';

interface ProofOfClearanceDownloadProps {
	graduationRequestId: number;
	studentNumber: number;
}

export default function ProofOfClearanceDownload({
	graduationRequestId,
	studentNumber,
}: ProofOfClearanceDownloadProps) {
	const [loading, setLoading] = useState(false);

	const handleDownload = async () => {
		try {
			setLoading(true);

			const graduationData =
				await getGraduationClearanceData(graduationRequestId);

			if (!graduationData) {
				console.error('No graduation data found for the specified request');
				return;
			}

			// Check if all departments have approved
			const clearanceStatus = getClearanceStatus(
				graduationData.graduationClearances
			);

			if (clearanceStatus !== 'approved') {
				console.error(
					'Cannot download proof of clearance - not all departments have approved'
				);
				alert(
					'Cannot download proof of clearance. All departments must approve your graduation request first.'
				);
				return;
			}

			const pdfBlob = await pdf(
				<ProofOfClearancePDF graduationData={graduationData} />
			).toBlob();

			const url = URL.createObjectURL(pdfBlob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `proof_of_clearance_${studentNumber}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Error generating PDF:', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<ActionIcon
			variant='light'
			color='green'
			size='sm'
			onClick={handleDownload}
			loading={loading}
			loaderProps={{ size: 'xs' }}
			data-proof-clearance-download
		>
			{!loading && <IconDownload size={16} />}
		</ActionIcon>
	);
}
