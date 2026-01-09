import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

function toGitPath(value) {
	return value.replaceAll('\\', '/');
}

function usage() {
	return 'Usage: pnpm worktree add <name>';
}

function parseName(argv) {
	const [command, name, ...rest] = argv;
	if (command === '-h' || command === '--help') {
		return { help: true };
	}
	if (command !== 'add') {
		throw new Error(usage());
	}
	if (!name) {
		throw new Error(usage());
	}
	if (name.startsWith('-')) {
		throw new Error('Invalid worktree name. Name cannot start with "-".');
	}
	if (rest.length > 0) {
		throw new Error(usage());
	}
	return { help: false, name };
}

function runGit(args) {
	const result = spawnSync('git', args, { stdio: 'inherit' });
	if (result.error) {
		throw result.error;
	}
	process.exit(result.status ?? 1);
}

function main() {
	const parsed = parseName(process.argv.slice(2));
	if (parsed.help) {
		process.stdout.write(`${usage()}\n`);
		process.exit(0);
	}
	const name = parsed.name;
	const worktreesRoot = path.resolve('..', 'worktrees', 'registry-web');
	mkdirSync(worktreesRoot, { recursive: true });

	const worktreePath = path.join(worktreesRoot, name);
	const gitWorktreePath = toGitPath(worktreePath);

	runGit(['worktree', 'add', '-b', name, gitWorktreePath]);
}

main();
