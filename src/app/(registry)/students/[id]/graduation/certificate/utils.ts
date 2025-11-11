import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import QRCode from 'qrcode';
import sharp from 'sharp';

const DEGREE_EXPANSIONS: Record<string, string> = {
	BA: 'Bachelor of Arts',
	BSc: 'Bachelor of Science',
	'B Bus': 'Bachelor of Business',
	BCom: 'Bachelor of Commerce',
	BEd: 'Bachelor of Education',
	BEng: 'Bachelor of Engineering',
	BFA: 'Bachelor of Fine Arts',
	BIT: 'Bachelor of Information Technology',
	BN: 'Bachelor of Nursing',
	LLB: 'Bachelor of Laws',
	MA: 'Master of Arts',
	MSc: 'Master of Science',
	MBA: 'Master of Business Administration',
	MEd: 'Master of Education',
	MEng: 'Master of Engineering',
	MFA: 'Master of Fine Arts',
	MIT: 'Master of Information Technology',
	LLM: 'Master of Laws',
	PhD: 'Doctor of Philosophy',
	DBA: 'Doctor of Business Administration',
	EdD: 'Doctor of Education',
};

export function expandProgramName(programName: string): string {
	const hasHons = programName.includes('(Hons)');
	const workingName = programName
		.replace(' (Hons)', '')
		.replace('(Hons)', '')
		.trim();

	for (const [abbrev, fullName] of Object.entries(DEGREE_EXPANSIONS)) {
		if (workingName.trim() === abbrev) {
			return hasHons ? `${fullName} (Hons)` : fullName;
		}

		if (workingName.startsWith(`${abbrev} `)) {
			const expanded = workingName.replace(`${abbrev} `, `${fullName} `);
			if (hasHons) {
				if (expanded.includes(' in ')) {
					const parts = expanded.split(' in ');
					return `${parts[0]} (Hons) in ${parts.slice(1).join(' in ')}`;
				}
				return `${expanded} (Hons)`;
			}
			return expanded;
		}
	}

	return programName;
}

function prependProgramLevel(programName: string, programCode: string): string {
	if (programName.startsWith('Associate')) {
		return `AD${programCode}`;
	}
	return programCode;
}

export function buildCertificateReference(
	programName: string,
	programCode: string,
	stdNo: number
): string {
	const normalizedCode = prependProgramLevel(programName, programCode);
	return `LSO${normalizedCode}${stdNo}`;
}

export async function generateQRCodeWithLogo(
	reference: string
): Promise<Buffer> {
	const verificationUrl = `http://portal.co.ls/verify/certificate/${reference}`;

	const qrCodeBuffer = await QRCode.toBuffer(verificationUrl, {
		errorCorrectionLevel: 'H',
		width: 400,
		margin: 2,
		color: {
			dark: '#000000',
			light: '#FFFFFF',
		},
	});

	try {
		const logoPath = join(process.cwd(), 'public', 'images', 'fly400x400.jpeg');
		const logoBuffer = await readFile(logoPath);

		const qrImage = sharp(qrCodeBuffer);
		const qrMetadata = await qrImage.metadata();
		const qrWidth = qrMetadata.width || 400;

		const logoSize = Math.floor(qrWidth * 0.18);
		const padding = Math.max(4, Math.floor(logoSize * 0.2));
		const paddedSize = logoSize + padding * 2;

		const resizedLogo = await sharp(logoBuffer)
			.resize(logoSize, logoSize, {
				fit: 'cover',
			})
			.toBuffer();

		const paddedLogo = await sharp({
			create: {
				width: paddedSize,
				height: paddedSize,
				channels: 4,
				background: { r: 255, g: 255, b: 255, alpha: 1 },
			},
		})
			.composite([
				{
					input: resizedLogo,
					top: padding,
					left: padding,
				},
			])
			.png()
			.toBuffer();

		const logoX = Math.floor((qrWidth - paddedSize) / 2);
		const logoY = Math.floor((qrWidth - paddedSize) / 2);

		const finalQR = await qrImage
			.composite([
				{
					input: paddedLogo,
					top: logoY,
					left: logoX,
				},
			])
			.png()
			.toBuffer();

		return finalQR;
	} catch (error) {
		console.error('Error adding logo to QR code:', error);
		return qrCodeBuffer;
	}
}

export async function generateQRCodeDataURL(
	reference: string
): Promise<string> {
	const qrBuffer = await generateQRCodeWithLogo(reference);
	const base64 = qrBuffer.toString('base64');
	return `data:image/png;base64,${base64}`;
}

export function formatIssueDate(date: Date): string {
	return date.toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	});
}
