import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import QRCode from 'qrcode';
import sharp from 'sharp';

export async function generateQRCodeDataURL(
	reference: string
): Promise<string> {
	const qrBuffer = await generateQRCodeWithLogo(reference);
	const base64 = qrBuffer.toString('base64');
	return `data:image/png;base64,${base64}`;
}

async function generateQRCodeWithLogo(reference: string): Promise<Buffer> {
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
