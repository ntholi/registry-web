'use server';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import fontkit from '@pdf-lib/fontkit';
import {
	buildCertificateReference,
	expandProgramName,
	formatIssueDate,
} from '@registry/students';
import type { PDFFont, PDFPage } from 'pdf-lib';
import { PDFDocument, rgb } from 'pdf-lib';
import { generateQRCodeDataURL } from '../utils';

const PRIMARY_COLOR = rgb(0, 0, 0);
const REFERENCE_RIGHT_MARGIN = 36;
const TEXT_HORIZONTAL_MARGIN = 60;

interface CertificateData {
	studentName: string;
	programName: string;
	programCode: string;
	stdNo: number;
	graduationDate?: Date;
}

export async function generateCertificatePDF(
	data: CertificateData
): Promise<Uint8Array> {
	const templatePath = join(
		process.cwd(),
		'src',
		'shared',
		'private',
		'files',
		'certificate.pdf'
	);
	const templateBytes = await readFile(templatePath);

	const pdfDoc = await PDFDocument.load(templateBytes);
	pdfDoc.registerFontkit(fontkit);

	const pages = pdfDoc.getPages();
	const firstPage = pages[0];

	const { width: pageWidth } = firstPage.getSize();
	const perfectCenterX = pageWidth / 2;

	const expandedProgramName = expandProgramName(data.programName);
	const reference = buildCertificateReference(
		data.programName,
		data.programCode,
		data.stdNo
	);
	const issueDate = formatIssueDate(data.graduationDate || new Date());

	const palatinoFontPath = join(
		process.cwd(),
		'public',
		'fonts',
		'palatino.ttf'
	);
	const palatinoFontBytes = await readFile(palatinoFontPath);
	const palatinoFont = await pdfDoc.embedFont(palatinoFontBytes);

	const snellFontPath = join(
		process.cwd(),
		'public',
		'fonts',
		'RoundhandBold.ttf'
	);
	const snellFontBytes = await readFile(snellFontPath);
	const snellFont = await pdfDoc.embedFont(snellFontBytes);

	firstPage.drawText(reference, {
		x:
			pageWidth -
			REFERENCE_RIGHT_MARGIN -
			palatinoFont.widthOfTextAtSize(reference, 8),
		y: 772,
		size: 8,
		font: palatinoFont,
		color: PRIMARY_COLOR,
	});

	drawCenteredText({
		page: firstPage,
		text: data.studentName,
		font: palatinoFont,
		y: 695,
		fontSize: 32,
		centerX: perfectCenterX,
		letterSpacingReduction: 1,
		maxWidth: pageWidth - 2 * TEXT_HORIZONTAL_MARGIN,
	});

	drawCenteredText({
		page: firstPage,
		text: expandedProgramName,
		font: snellFont,
		y: 605,
		fontSize: 40,
		centerX: perfectCenterX,
		letterSpacingReduction: 1.6,
		maxWidth: 550,
		lineSpacing: 1.2,
	});

	drawCenteredText({
		page: firstPage,
		text: issueDate,
		font: palatinoFont,
		y: 180,
		fontSize: 12.4,
		centerX: perfectCenterX,
		letterSpacingReduction: 0,
		maxWidth: pageWidth - 2 * TEXT_HORIZONTAL_MARGIN,
	});

	const qrCodeDataUrl = await generateQRCodeDataURL(reference);
	const qrCodeImageBytes = await fetch(qrCodeDataUrl).then((res) =>
		res.arrayBuffer()
	);
	const qrCodeImage = await pdfDoc.embedPng(qrCodeImageBytes);

	const qrSize = 50;
	const qrX = perfectCenterX - qrSize / 2;
	const qrY = 220;

	firstPage.drawImage(qrCodeImage, {
		x: qrX,
		y: qrY,
		width: qrSize,
		height: qrSize,
	});

	const pdfBytes = await pdfDoc.save();
	return pdfBytes;
}

interface DrawCenteredTextOptions {
	page: PDFPage;
	text: string;
	font: PDFFont;
	y: number;
	fontSize: number;
	centerX: number;
	letterSpacingReduction: number;
	maxWidth: number;
	lineSpacing?: number;
}

function drawCenteredText({
	page,
	text,
	font,
	y,
	fontSize,
	centerX,
	letterSpacingReduction,
	maxWidth,
	lineSpacing = 1.2,
}: DrawCenteredTextOptions): void {
	function getTextWidth(textSegment: string): number {
		if (letterSpacingReduction === 0) {
			return font.widthOfTextAtSize(textSegment, fontSize);
		}
		const baseWidth = font.widthOfTextAtSize(textSegment, fontSize);
		return baseWidth - (textSegment.length - 1) * letterSpacingReduction;
	}

	function drawLine(lineText: string, yPos: number): void {
		if (letterSpacingReduction === 0) {
			const lineWidth = font.widthOfTextAtSize(lineText, fontSize);
			const startX = centerX - lineWidth / 2;
			page.drawText(lineText, {
				x: startX,
				y: yPos,
				size: fontSize,
				font: font,
				color: PRIMARY_COLOR,
			});
			return;
		}

		const lineWidth = getTextWidth(lineText);
		let currentX = centerX - lineWidth / 2;

		for (const char of lineText) {
			page.drawText(char, {
				x: currentX,
				y: yPos,
				size: fontSize,
				font: font,
				color: PRIMARY_COLOR,
			});
			const charWidth = font.widthOfTextAtSize(char, fontSize);
			currentX += charWidth - letterSpacingReduction;
		}
	}

	if (getTextWidth(text) <= maxWidth) {
		drawLine(text, y);
		return;
	}

	const words = text.split(' ');
	const lines: string[] = [];
	let currentLine = '';

	for (const word of words) {
		const testLine = currentLine + (currentLine ? ' ' : '') + word;
		if (getTextWidth(testLine) <= maxWidth) {
			currentLine = testLine;
		} else {
			if (currentLine) {
				lines.push(currentLine);
				currentLine = word;
			} else {
				// Single word is too long, break it by characters
				if (getTextWidth(word) > maxWidth) {
					let charLine = '';
					for (const char of word) {
						const testCharLine = charLine + char;
						if (getTextWidth(testCharLine) <= maxWidth) {
							charLine = testCharLine;
						} else {
							if (charLine) {
								lines.push(charLine);
							}
							charLine = char;
						}
					}
					if (charLine) {
						currentLine = charLine;
					}
				} else {
					currentLine = word;
				}
			}
		}
	}

	if (currentLine) {
		lines.push(currentLine);
	}

	const lineHeight = fontSize * lineSpacing;
	const totalHeight = (lines.length - 1) * lineHeight;
	const startY = y + totalHeight / 2;

	for (let i = 0; i < lines.length; i++) {
		const lineY = startY - i * lineHeight;
		drawLine(lines[i], lineY);
	}
}
