import { type NextRequest, NextResponse } from 'next/server';
import { modulesRepository } from '@/modules/academic/features/semester-modules/server/repository';
import TermRepository from '@/modules/registry/features/terms/server/repository';

export async function GET(request: NextRequest) {
	const search = request.nextUrl.searchParams.get('module');
	if (!search) return NextResponse.json([]);
	const term = await new TermRepository().getActive();
	if (!term) {
		throw new Error('No active term');
	}
	const modules = await modulesRepository.searchModulesWithDetails(
		search,
		term
	);
	return NextResponse.json(modules);
}
