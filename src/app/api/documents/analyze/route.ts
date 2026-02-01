import { NextResponse } from 'next/server';
import { auth } from '@/core/auth';
import {
	analyzeAcademicDocument,
	analyzeDocument,
	analyzeIdentityDocument,
} from '@/core/integrations/ai/documents';

interface RequestBody {
	type: 'identity' | 'academic' | 'any';
	base64: string;
	mediaType: string;
	certificateTypes?: Array<string | { name: string; lqfLevel: number | null }>;
	applicantName?: string;
}

export async function POST(request: Request) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json(
			{ success: false, error: 'Unauthorized' },
			{ status: 401 }
		);
	}

	const body: RequestBody = await request.json();
	const { type, base64, mediaType, certificateTypes, applicantName } = body;

	if (!base64 || !mediaType) {
		return NextResponse.json(
			{
				success: false,
				error: 'Missing required fields: base64 and mediaType',
			},
			{ status: 400 }
		);
	}

	if (type === 'identity') {
		const result = await analyzeIdentityDocument(base64, mediaType);
		return NextResponse.json(result);
	}

	if (type === 'academic') {
		const result = await analyzeAcademicDocument(
			base64,
			mediaType,
			certificateTypes,
			applicantName
		);
		return NextResponse.json(result);
	}

	if (type === 'any') {
		const result = await analyzeDocument(base64, mediaType);
		return NextResponse.json(result);
	}

	return NextResponse.json(
		{
			success: false,
			error: 'Invalid type. Must be identity, academic, or any',
		},
		{ status: 400 }
	);
}
