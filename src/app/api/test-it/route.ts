import { type NextRequest, NextResponse } from 'next/server';
import ModuleRepository from '@/server/semester-modules/repository';
import TermRepository from '@/server/terms/repository';

export async function GET(request: NextRequest) {
	const search = request.nextUrl.searchParams.get('module');
	if (!search) return NextResponse.json([]);
	const term = await new TermRepository().getActive();
	if (!term) {
		throw new Error('No active term');
	}
	const modules = await new ModuleRepository().searchModulesWithDetails(
		search,
		term
	);
	return NextResponse.json(modules);
}
