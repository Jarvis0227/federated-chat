import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const approvalLabel = "审核通过";
const fields = new Map([
	["站点名称", "siteName"],
	["站点介绍", "siteDescription"],
	["站点主页", "siteUrl"],
	["聊天室名称", "chatName"],
	["公开聊天室", "chatUrl"],
	["站点图标", "siteIconUrl"],
	["Matrix homeserver", "homeserver"],
	["站点颜色", "color"],
	["站长 Matrix ID", "matrixUserId"],
	["站长 GitHub 用户名", "githubUsername"],
	["Matrix 接入方式", "matrixAccountType"],
	["转发账号 Matrix ID", "matrixRelayUserId"],
]);
const matrixId = /^@[^\s:<>]+:(?:[a-z\d.-]+|\[[a-f\d:.]+\])(?::\d{1,5})?$/iu;
const notAnswered = /^_No response_$/i;

function httpUrl(text, field) {
	let url;
	try { url = new URL(text); } catch { throw new Error(`${field} 必须是完整网址`); }
	if (!/^https?:\/\//iu.test(text) || /[\s\\]/u.test(text) || !["https:", "http:"].includes(url.protocol) || url.username || url.password) {
		throw new Error(`${field} 必须是无登录信息的 HTTP(S) 网址`);
	}
	return url;
}

function parseFields(body) {
	if (typeof body !== "string" || body.length > 15000) throw new Error("申请表为空或过长");
	const normalized = body.replace(/\r\n/g, "\n");
	const headings = [...normalized.matchAll(/^### +(.+?)[ \t]*$/gm)];
	const member = {};
	for (const [index, heading] of headings.entries()) {
		const label = heading[1];
		const key = fields.get(label);
		if (!key) continue;
		if (Object.hasOwn(member, key)) throw new Error(`申请表有重复字段：${label}`);
		const value = normalized.slice(heading.index + heading[0].length, headings[index + 1]?.index).trim();
		member[key] = notAnswered.test(value) || (key === "matrixAccountType" && /^None$/i.test(value)) ? "" : value;
	}
	return member;
}

function validateMember(member) {
	member.matrixRelayUserId ??= "";
	for (const [label, key] of fields) {
		const value = member[key];
		if (key !== "matrixRelayUserId" && !value) throw new Error(`缺少字段：${label}`);
		if (value?.length > (key === "siteDescription" ? 1000 : key.endsWith("Url") ? 2048 : 120) ||
			/[\x00-\x08\x0b-\x1f\x7f]/u.test(value) || (key !== "siteDescription" && value?.includes("\n"))) {
			throw new Error(`字段格式不正确：${label}`);
		}
	}
	for (const key of ["siteUrl", "chatUrl", "siteIconUrl"]) httpUrl(member[key], key);
	if (!/^(?:[a-z\d.-]+|\[[a-f\d:.]+\])(?::\d{1,5})?$/iu.test(member.homeserver)) throw new Error("Matrix homeserver 格式不正确");
	if (!matrixId.test(member.matrixUserId)) throw new Error("站长 Matrix ID 格式不正确");
	if (!["user", "relay"].includes(member.matrixAccountType)) throw new Error("Matrix 接入方式必须是 user 或 relay");
	if (member.matrixAccountType === "relay" ? !matrixId.test(member.matrixRelayUserId) : member.matrixRelayUserId !== "") throw new Error("转发账号应按接入方式填写");
	if (!/^(?:#[a-f\d]{3,8}|[a-z]+|(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\([a-z\d.%+\s/,-]+\))$/iu.test(member.color) ||
		(member.color.startsWith("#") && ![4, 5, 7, 9].includes(member.color.length))) throw new Error("站点颜色格式不正确");
	return member;
}

export function parseApplication(body, login) {
	const member = parseFields(body);
	if (typeof member.githubUsername !== "string" || !/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/iu.test(member.githubUsername) || member.githubUsername.toLowerCase() !== login.toLowerCase()) {
		throw new Error("站长 GitHub 用户名应与 Issue 提交账号一致");
	}
	member.githubUsername = login;
	return validateMember(member);
}

export function addMember(members, member) {
	if (!Array.isArray(members)) throw new Error("members.json 不是数组");
	const siteHost = value => new URL(value).hostname.replace(/^www\./iu, "").toLowerCase();
	const accountIds = value => [value.matrixUserId, value.matrixRelayUserId].filter(Boolean);
	if (members.some(item => item.githubUsername.toLowerCase() === member.githubUsername.toLowerCase() ||
		siteHost(item.siteUrl) === siteHost(member.siteUrl) ||
		accountIds(item).some(id => accountIds(member).includes(id)))) {
		throw new Error("名单里已有相同的 GitHub、站点或 Matrix 账号，请改走资料更新流程");
	}
	return [...members, member];
}

export function updateMember(members, body, login) {
	if (!Array.isArray(members)) throw new Error("members.json 不是数组");
	const matching = members.flatMap((member, index) => member.githubUsername.toLowerCase() === login.toLowerCase() ? [index] : []);
	if (matching.length !== 1) throw new Error("Issue 作者必须在成员名单中拥有唯一绑定的 GitHub 账号");
	const [index] = matching;
	const fields = parseFields(body);
	if (Object.hasOwn(fields, "githubUsername")) throw new Error("GitHub 账号换绑需维护者手动核对");
	const changes = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== ""));
	const current = members[index];
	const next = { ...current, ...changes };
	if (changes.matrixAccountType === "user" && !changes.matrixRelayUserId) next.matrixRelayUserId = "";
	validateMember(next);
	if (Object.keys(next).every(key => next[key] === current[key])) throw new Error("没有需要更新的资料");
	addMember(members.filter((_, position) => position !== index), next);
	return members.map((member, position) => position === index ? next : member);
}

async function api(path, method = "GET", data, allowMissing = false) {
	const response = await fetch(`${process.env.GITHUB_API_URL}${path}`, {
		method,
		headers: {
			Authorization: `Bearer ${process.env.GH_TOKEN}`,
			Accept: "application/vnd.github+json",
			"Content-Type": "application/json",
		},
		body: data === undefined ? undefined : JSON.stringify(data),
		signal: AbortSignal.timeout(25000),
	});
	if (allowMissing && response.status === 404) return null;
	if (!response.ok) throw new Error(`GitHub API ${method} ${path}: ${response.status}`);
	return response.json();
}

async function propose() {
	const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
	const number = event.issue?.number;
	if (event.action !== "labeled" || event.label?.name !== approvalLabel || !Number.isSafeInteger(number) || number < 1) return;
	const path = `/repos/${process.env.GITHUB_REPOSITORY}`;
	const permission = await api(`${path}/collaborators/${encodeURIComponent(event.sender.login)}/permission`);
	if (!["write", "maintain", "admin"].includes(permission.permission)) throw new Error("只有有写入权限的维护者能审核");
	const issue = await api(`${path}/issues/${number}`);
	const update = issue.title.startsWith("[资料更新]");
	if (issue.state !== "open" || issue.pull_request || !(update || issue.title.startsWith("[申请加入]")) || !issue.labels.some(label => label.name === approvalLabel)) return;
	if (issue.title !== event.issue.title || issue.body !== event.issue.body || issue.user.login !== event.issue.user.login) throw new Error("申请在审核后改过，请核对后重新贴标签");

	const branch = `automation/${update ? "update" : "join"}-issue-${number}`;
	const owner = process.env.GITHUB_REPOSITORY.split("/")[0];
	const base = event.repository.default_branch;
	const existing = await api(`${path}/pulls?state=all&head=${encodeURIComponent(`${owner}:${branch}`)}&base=${encodeURIComponent(base)}`);
	if (existing.some(pr => pr.state === "open" || pr.merged_at)) {
		console.log("该申请已有 PR");
		return;
	}
	if (existing.length) throw new Error("上次生成的 PR 已关闭，请维护者处理原 PR");

	const baseRef = await api(`${path}/git/ref/heads/${encodeURIComponent(base)}`);
	const parent = baseRef.object.sha;
	const [commit, file] = await Promise.all([
		api(`${path}/git/commits/${parent}`),
		api(`${path}/contents/members.json?ref=${parent}`),
	]);
	const members = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
	const proposed = update
		? updateMember(members, issue.body, issue.user.login)
		: addMember(members, parseApplication(issue.body, issue.user.login));
	const content = `${JSON.stringify(proposed, null, 2)}\n`;
	const currentBranch = await api(`${path}/git/ref/heads/${branch}`, "GET", undefined, true);
	if (currentBranch) {
		const comparison = await api(`${path}/compare/${parent}...${currentBranch.object.sha}`);
		const pending = await api(`${path}/contents/members.json?ref=${currentBranch.object.sha}`);
		if (comparison.status !== "ahead" || comparison.files.length !== 1 || comparison.files[0].filename !== "members.json" ||
			Buffer.from(pending.content, "base64").toString("utf8") !== content) throw new Error("申请分支已有其他改动，请维护者检查");
	} else {
		const tree = await api(`${path}/git/trees`, "POST", {
			base_tree: commit.tree.sha,
			tree: [{ path: "members.json", mode: "100644", type: "blob", content }],
		});
		const proposal = await api(`${path}/git/commits`, "POST", {
			message: `${update ? "chore: update member" : "feat: add member"} from issue #${number}`, tree: tree.sha, parents: [parent],
		});
		await api(`${path}/git/refs`, "POST", { ref: `refs/heads/${branch}`, sha: proposal.sha });
	}
	const created = await api(`${path}/pulls`, "POST", {
		title: `[${update ? "资料更新" : "成员加入"}] 申请 #${number}`,
		body: `${update ? "根据已登记账号提交的申请更新该成员的资料。请核对所改字段。" : "根据维护者审核通过的申请生成成员名单变更。请核对站点资料和 Matrix 联调结果。"}\n\nCloses #${number}`,
		head: branch,
		base,
	});
	console.log(created.html_url);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	propose().catch(error => { console.error(error.message); process.exitCode = 1; });
}
