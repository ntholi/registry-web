import ModuleRepository from '@/server/semester-modules/repository';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('module');
  if (!search) return NextResponse.json([]);
  const modules = await new ModuleRepository().searchModulesWithDetails(
    search,
    '2025-02',
  );
  return NextResponse.json(modules);
}
