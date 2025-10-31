import { generateCertificatePDF } from '@/server/certificates/actions';

interface CertificatePDFProps {
	studentName: string;
	programName: string;
	programCode: string;
	stdNo: number;
	graduationDate?: Date;
}

export async function generateCertificate(props: CertificatePDFProps): Promise<Blob> {
	const pdfBytes = await generateCertificatePDF({
		studentName: props.studentName,
		programName: props.programName,
		programCode: props.programCode,
		stdNo: props.stdNo,
		graduationDate: props.graduationDate,
	});

	return new Blob([Buffer.from(pdfBytes)], { type: 'application/pdf' });
}
