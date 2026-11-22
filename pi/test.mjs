import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import researchViewer from "./extensions/research-viewer.ts";

const handlers = new Map();
const calls = [];
const prompts = [];
const notices = [];
let command;
let result = { code: 0, stdout: "", stderr: "" };
let idle = true;
researchViewer({
	on: (name, handler) => handlers.set(name, handler),
	registerCommand: (name, registration) => {
		assert.equal(name, "show");
		command = registration;
	},
	exec: async (binary, args, options) => {
		calls.push({ binary, args, options });
		return result;
	},
	sendUserMessage: (text, options) => prompts.push({ text, options }),
});
const ctx = { cwd: "/work", isIdle: () => idle, ui: { notify: (...args) => notices.push(args) } };
const run = async (args) => {
	calls.length = 0;
	notices.length = 0;
	await command.handler(args, ctx);
};

await run('"results/equity curve.png" one.csv a\\ b.csv \'literal$(touch nope).csv\'');
assert.deepEqual(calls[0], {
	binary: "research-viewer",
	args: ["show", "results/equity curve.png", "one.csv", "a b.csv", "literal$(touch nope).csv"],
	options: { cwd: "/work" },
});
assert.equal(prompts.length, 0, "explicit paths must not start a model turn");
await run("close");
assert.deepEqual(calls.map((call) => call.args), [["close"]]);
await run("--popup");
assert.deepEqual(calls.map((call) => call.args), [["close"], ["open", "--popup"]]);
for (const input of ['"unclosed', "trailing\\", "''", '"a\nb.csv"']) {
	await run(input);
	assert.equal(calls.length, 0, "malformed arguments must not execute");
	assert.equal(notices.at(-1)[1], "error");
}
await run("");
assert.equal(calls.length, 0);
assert.match(prompts.at(-1).text, /most recently produced or mentioned/);
idle = false;
await run("");
assert.deepEqual(prompts.at(-1).options, { deliverAs: "followUp" });
result = { code: 1, stdout: "", stderr: "missing file" };
await run("missing.csv");
assert.deepEqual(notices.at(-1), ["missing file", "error"]);
result = { code: 0, stdout: "could not split a pane", stderr: "" };
await run("one.csv");
assert.equal(notices.at(-1)[1], "warning");

const event = { systemPromptOptions: { sections: { existing: "keep" } } };
handlers.get("before_agent_start")(event);
assert.equal(event.systemPromptOptions.sections.existing, "keep");
assert.match(event.systemPromptOptions.sections.research_viewer, /rv.localhost/);

const temp = mkdtempSync(join(tmpdir(), "rv-pi-test-"));
try {
	const file = join(temp, "equity curve.csv");
	writeFileSync(file, "a,b\n1,2\n");
	const link = "http://rv.localhost" + file.split("/").map(encodeURIComponent).join("/");
	const message = { role: "assistant", content: [{ type: "text", text: `See \`${file}\`.` }] };
	const augmented = handlers.get("message_end")({ message }).message;
	assert.equal(augmented.content[0].text, `${message.content[0].text}\n\n${link}`);
	assert.equal(handlers.get("message_end")({ message: augmented }), undefined, "links must not duplicate");
	for (const text of ["https://example.com/report.csv", "/does-not-exist.csv", link]) {
		assert.equal(handlers.get("message_end")({ message: { ...message, content: [{ type: "text", text }] } }), undefined);
	}
	assert.equal(handlers.get("message_end")({ message: { ...message, role: "user" } }), undefined);
} finally {
	rmSync(temp, { recursive: true });
}
console.log("PASS command routing, quoted paths, malformed input, no-args, errors, guidance, and viewer links");
