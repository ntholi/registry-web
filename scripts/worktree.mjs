import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

function toGitPath(value) {
	return value.replaceAll('\\', '/');
}

function parseName(argv) {
	const [name] = argv;
	if (!name) {
		throw new Error('Missing worktree name. Usage: pnpm worktree <name>');
	}
	if (name.startsWith('-')) {
		throw new Error('Invalid worktree name. Name cannot start with "-".');
	}
	return name;
}

function runGit(args) {
	const result = spawnSync('git', args, { stdio: 'inherit' });
	if (result.error) {
		throw result.error;
	}
	process.exit(result.status ?? 1);
}

function main() {
	const name = parseName(process.argv.slice(2));
	const worktreesRoot = path.resolve('..', 'worktrees', 'registry-web');
	mkdirSync(worktreesRoot, { recursive: true });

	const worktreePath = path.join(worktreesRoot, name);
	const gitWorktreePath = toGitPath(worktreePath);

	runGit(['worktree', 'add', '-b', name, gitWorktreePath]);
}

main();
