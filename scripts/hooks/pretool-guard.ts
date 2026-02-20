type PreToolHookResult = {
	hookSpecificOutput: {
		hookEventName: "PreToolUse";
		permissionDecision: "allow" | "ask" | "deny";
		permissionDecisionReason?: string;
	};
};

async function readStdin(): Promise<string> {
	return await new Response(Bun.stdin.stream()).text();
}

function ask(reason: string): PreToolHookResult {
	return {
		hookSpecificOutput: {
			hookEventName: "PreToolUse",
			permissionDecision: "ask",
			permissionDecisionReason: reason,
		},
	};
}

function allow(): PreToolHookResult {
	return {
		hookSpecificOutput: {
			hookEventName: "PreToolUse",
			permissionDecision: "allow",
		},
	};
}

const destructivePatterns = [
	/git\s+reset\s+--hard/i,
	/git\s+checkout\s+--/i,
	/git\s+clean\s+-fd/i,
	/\brm\s+-rf\b/i,
	/\bdel\s+\/f\s+\/q\b/i,
	/\bformat\b/i,
];

const stdinText = await readStdin();
const normalized = stdinText.toLowerCase();

const hasDangerousPattern = destructivePatterns.some((pattern) =>
	pattern.test(normalized),
);

const result = hasDangerousPattern
	? ask("Potentially destructive command detected. Confirm before running.")
	: allow();

console.log(JSON.stringify(result));

export {};
