import { modulesRepository } from '@academic/semester-modules';
import { getCurrentTerm } from '@registry/terms';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	const search = request.nextUrl.searchParams.get('module');
	if (!search) return NextResponse.json([]);
	const term = await getCurrentTerm();
	if (!term) {
		throw new Error('No active term');
	}
	const modules = await modulesRepository.searchModulesWithDetails(
		search,
		term
	);
	return NextResponse.json(modules);
}
