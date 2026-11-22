import { existsSync } from "node:fs";
import type {
	BeforeAgentStartEvent,
	ExtensionAPI,
	ExtensionCommandContext,
	MessageEndEvent,
} from "@earendil-works/pi-coding-agent";

const HINT = [
	"Ctrl+B i   open / close the viewer pane      (click the pane first for the keys below)",
	"← →  item     1-9 / Tab / click  tabs     [ ]  batch     h  history (type to filter)",
	"i  folder index (stages)    f  full view in this pane    o  open outside    q quit   x close",
].join("\n");

const MODEL_SHOW_REQUEST = `Display the chart, table, report, image, PDF, HTML, or text file most recently produced or mentioned in this conversation. If several files were discussed together, run \`research-viewer show\` with all absolute paths in the order discussed. If no file was produced or mentioned, run \`research-viewer open\`. Do not read an image to display it. Confirm what is on screen, then include this key hint:\n\n${HINT}`;
const LOCAL_PATH = /`(\/[^`\n]+)`|(?:^|[\s("'])(\/[^\s`"'()<>\[\]{}]+)/g;

type ShowRequest =
	| { kind: "infer" }
	| { kind: "close" }
	| { kind: "popup" }
	| { kind: "files"; paths: string[] };

function parseArgs(input: string): string[] {
	const args: string[] = [];
	let current = "";
	let quote: "'" | '"' | undefined;
	let started = false;
	let escaped = false;

	for (const char of input) {
		if (escaped) {
			current += char;
			escaped = false;
			started = true;
		} else if (char === "\\" && quote !== "'") {
			escaped = true;
		} else if (quote) {
			if (char === quote) quote = undefined;
			else current += char;
		} else if (char === "'" || char === '"') {
			quote = char;
			started = true;
		} else if (/\s/.test(char)) {
			if (started) {
				args.push(current);
				current = "";
				started = false;
			}
		} else {
			current += char;
			started = true;
		}
	}

	if (quote || escaped) throw new Error("Unclosed quote or trailing backslash in /show arguments.");
	if (started) args.push(current);
	if (args.some((arg) => !arg || /[\r\n\0]/.test(arg))) {
		throw new Error("/show paths must be non-empty and contain no newlines or NUL bytes.");
	}
	return args;
}

function parseRequest(rawArgs: string): ShowRequest {
	const args = parseArgs(rawArgs.trim());
	if (args.length === 0) return { kind: "infer" };
	if (args.length === 1 && args[0] === "close") return { kind: "close" };
	if (args.length === 1 && args[0] === "--popup") return { kind: "popup" };
	return { kind: "files", paths: args };
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function viewerPaths(text: string): string[] {
	const paths: string[] = [];
	for (const match of text.matchAll(LOCAL_PATH)) {
		const candidate = match[1] ?? match[2];
		const path = existsSync(candidate) ? candidate : candidate.replace(/[.,;:!?]+$/, "");
		if (existsSync(path)) paths.push(path);
	}
	return [...new Set(paths)];
}

function viewerLink(path: string): string {
	return `http://rv.localhost${path.split("/").map(encodeURIComponent).join("/")}`;
}

export default function researchViewer(pi: ExtensionAPI) {
	pi.on("before_agent_start", (event: BeforeAgentStartEvent) => {
		event.systemPromptOptions.sections.research_viewer = [
			"When you mention a file that the user may want to see, also put its viewer link on a separate line.",
			"Use `http://rv.localhost/<absolute path>`. Plain file paths do not open in the research-viewer pane.",
			"The user can Ctrl+click the link in herdr to show the file without opening a browser.",
		].join("\n");
	});

	pi.on("message_end", (event: MessageEndEvent) => {
		if (event.message.role !== "assistant") return;
		const textParts: string[] = [];
		for (const block of event.message.content) {
			if (block.type === "text") textParts.push(block.text);
		}
		const text = textParts.join("\n");
		const links = viewerPaths(text)
			.map(viewerLink)
			.filter((link) => !text.includes(link));
		if (links.length === 0) return;

		let lastTextIndex = -1;
		for (let index = 0; index < event.message.content.length; index += 1) {
			if (event.message.content[index].type === "text") lastTextIndex = index;
		}
		if (lastTextIndex === -1) return;
		const content = [...event.message.content];
		const block = content[lastTextIndex];
		if (block.type !== "text") return;
		content[lastTextIndex] = { ...block, text: `${block.text}\n\n${links.join("\n")}` };
		return { message: { ...event.message, content } };
	});

	pi.registerCommand("show", {
		description: "Show files in the research-viewer pane, or infer the latest file",
		getArgumentCompletions: (prefix: string) => {
			const values = ["close", "--popup"];
			const matches = values.filter((value) => value.startsWith(prefix));
			return matches.length ? matches.map((value) => ({ value, label: value })) : null;
		},
		handler: async (rawArgs: string, ctx: ExtensionCommandContext) => {
			try {
				const request = parseRequest(rawArgs);
				if (request.kind === "infer") {
					pi.sendUserMessage(MODEL_SHOW_REQUEST, ctx.isIdle() ? undefined : { deliverAs: "followUp" });
					return;
				}
				let commandArgs: string[];
				let successMessage: string;
				switch (request.kind) {
					case "close":
						commandArgs = ["close"];
						successMessage = "Closed the research-viewer pane.";
						break;
					case "popup": {
						const closeResult = await pi.exec("research-viewer", ["close"]);
						if (closeResult.code !== 0) {
							ctx.ui.notify(closeResult.stderr.trim() || "Could not close research-viewer.", "error");
							return;
						}
						commandArgs = ["open", "--popup"];
						successMessage = "Opened research-viewer with Preview popups.";
						break;
					}
					case "files":
						commandArgs = ["show", ...request.paths];
						successMessage = `Showing ${request.paths.join(", ")} in research-viewer.`;
						break;
					default: {
						const exhaustive: never = request;
						return exhaustive;
					}
				}

				const result = await pi.exec("research-viewer", commandArgs, { cwd: ctx.cwd });
				const output = [result.stdout, result.stderr].map((value) => value.trim()).filter(Boolean).join("\n");
				if (result.code !== 0) {
					ctx.ui.notify(output || `research-viewer exited with code ${result.code}.`, "error");
					return;
				}
				if (output.includes("not inside herdr") || output.includes("could not split a pane")) {
					ctx.ui.notify(output, "warning");
					return;
				}
				ctx.ui.notify(`${successMessage}\n\n${HINT}`, "info");
			} catch (error) {
				ctx.ui.notify(`Could not run research-viewer: ${errorMessage(error)}`, "error");
			}
		},
	});
}
