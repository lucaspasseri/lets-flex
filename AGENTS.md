# Let’s Flex — Contributor Instructions

## Rule levels

- **Required:** non-negotiable project constraints.
- **Preferred:** normal project conventions; departures need a documented reason.
- **Conditional:** required only for the change types identified by the rule.

## Precedence

Apply guidance in this order:

1. explicit user instructions for the current task;
2. repository-level Required rules;
3. active-goal and current-action constraints, when the task contributes to the active goal;
4. Preferred project conventions.

Raise security or data-integrity conflicts instead of silently following lower-priority guidance.

## Required workflow

- Before working, read `docs/general-guidelines.md`.
- Use the repository and tests as the source of truth for the current implementation.
- Before planning or implementing a goal, compare the requested outcome with the repository's
  current state and any completed related goals or actions. Plan and implement only the delta:
  behavior that is missing, changed, broken, or explicitly being reconsidered.
- Treat completed goals and actions as historical evidence of established behavior. Do not
  automatically reopen, repeat, replace, or reimplement them merely because a new goal overlaps
  the same feature area.
- Reuse compatible existing architecture, services, repositories, helpers, components, tests,
  and verified behavior instead of creating parallel implementations.
- If repository evidence conflicts with historical goal/action records, treat the repository
  and tests as authoritative for what currently exists, and record the discrepancy before
  planning corrective work.
- Keep changes cohesive and within the requested scope.
- Do not silently implement worthwhile but unrelated discoveries. Document or propose them
  as follow-up work unless they are required to make the requested change correct or safe.

## Database lifecycle policy

### Current phase and source of truth

Required until the user explicitly changes this policy:

- The application is in an active-development, disposable-data phase. Development database
  contents do not need to be preserved.
- `db/schema.js` is the authoritative current schema and `db/seed.js` is the canonical seed
  and reset entry point. A fresh development database must be fully reproducible from those
  current definitions without replaying historical migrations.
- Prefer resetting development databases over accumulating migrations. Migration-driven
  schema evolution is not the default workflow during this phase.
- Keep one authoritative setup path: create the current schema, then apply the complete
  canonical development seed. Preserve useful reference, catalog, relationship, and sample
  data and their foreign-key ordering in that path.

### Schema-change workflow

Required for a development schema change:

1. Update the authoritative schema definition.
2. Update the canonical seed when the changed schema or development dataset requires it.
3. If `ALLOW_DATABASE_RESET=true`, confirm that the configured target is the intended local
   or development database, run `npm run db:reset`, and do not leave that database knowingly
   behind the repository schema when the reset is safe and executable.
4. Verify the resulting schema, required seed data, important relationships, and application
   access, then run the relevant tests.

### Migration policy during this phase

Required:

- Do not create migrations for ordinary development schema changes.
- A migration is permitted only when the task explicitly requires a non-destructive upgrade
  path, existing data must be preserved, the user explicitly requests one, or migration
  behavior itself is being implemented or tested.
- Before removing a historical development migration, verify that the current schema
  incorporates its final state and that application startup, tests, deployment, CI, and other
  tooling do not depend on it. Remove obsolete migration references and migration-only tests
  together with the file.
- Do not add a migration runner or preserve migration complexity for a possible future need.

### Production safety boundary

Required:

- Development reset authorization never grants production authorization. Never
  automatically reset, migrate, or otherwise mutate production data.
- `ALLOW_DATABASE_RESET=true` authorizes only the specifically confirmed local or
  development database target. Preserve or strengthen the production refusal and explicit
  reset opt-in safeguards.
- Do not implement a speculative migration-first production workflow. When persistent user
  data must be preserved, the user will explicitly replace this policy.

## Conditional guidance

- **Active-goal work:** read and follow `docs/current-goal.md` and
  `docs/current-actions.md` before changing code.
- **UI work:** for EJS, CSS, components, icons, accessibility, or interaction changes,
  also read `docs/ui-guidelines.md`.
- **Tasks outside the active goal:** use the normal implementation and verification
  workflow. Do not modify active-goal tracking files or apply their approval gates.
- **Ambiguous applicability:** ask whether the task belongs to the active goal before
  changing goal or action state.

## Delta-first planning

This section applies whenever a new goal, revised goal, or new action overlaps existing behavior.

Required:

1. Establish the current state from the repository, tests, migrations, configuration, and other
   relevant implementation evidence.
2. Read completed related goal/action records when they are available and use them as historical
   context, not as instructions to repeat work.
3. Compare the requested end state with the verified current state.
4. Classify each relevant capability as one of:
   - `Already satisfied` — present and compatible with the new goal;
   - `Reuse` — existing implementation should be used by the new work;
   - `Modify` — existing behavior must change to satisfy the new goal;
   - `Add` — required behavior does not yet exist;
   - `Repair` — intended behavior exists but is currently broken or incomplete;
   - `Explicitly reconsider` — the user has asked to revisit a previously completed decision.
5. Build the proposed action sequence only from `Modify`, `Add`, `Repair`, and
   `Explicitly reconsider` items. Do not create implementation actions for `Already satisfied`
   or `Reuse` items unless verification or integration work is genuinely required.
6. Preserve compatible architectural decisions and security/data-integrity invariants from
   completed work. A nearby new goal does not implicitly authorize redesign.
7. If an existing implementation already satisfies part or all of a proposed action, narrow
   or remove that action instead of executing it again.
8. Reopen completed work only when at least one of these is true:
   - the user explicitly requests reconsideration;
   - the new goal changes its acceptance criteria or required behavior;
   - repository or test evidence shows the completed behavior is missing, broken, or incompatible;
   - correctness, security, or data integrity requires a change.
9. When reopening completed work, record why it is being reopened and what specific delta is
   required. Do not reset the entire historical goal by default.

For new-goal planning, prefer a concise baseline such as:

- `Existing relevant capabilities`
- `Verified gaps or changes`
- `Proposed delta actions`

The purpose of this baseline is to make clear what is being reused and what is actually new.

## Evidence and assumptions

This section applies whenever the coding agent is planning, reviewing, or implementing work.

Required:

- Do not infer implementation details solely from goal summaries, action history, naming,
  conventions, nearby code, or expected architecture.
- Verify relevant behavior in the repository, tests, migrations, configuration, or other direct
  implementation evidence before relying on it in a plan, review, or implementation.
- Clearly distinguish among:
  - `Verified` — directly supported by repository or other direct implementation evidence;
  - `Assumption` — plausible but not yet verified;
  - `Unknown` — insufficient evidence is available to make a reliable claim.
- Do not build an action plan on an `Assumption` when the repository can reasonably be inspected
  to resolve it.
- Do not promote an assumption to `Verified` merely because it is consistent with prior goals,
  naming conventions, expected architecture, or nearby implementation patterns.
- Never invent missing architectural relationships, dependencies, abstractions, database behavior,
  or control flow to make documentation and implementation appear consistent.
- If historical documentation and repository evidence disagree, report the discrepancy explicitly
  rather than silently reconciling them.
- If verification is not reasonably possible, preserve the uncertainty in the plan and explain what
  evidence would be needed to resolve it.
- Prefer narrowing an action because of uncertainty over expanding its scope based on an
  unverified inference.
- Security, authentication, authorization, session, data-integrity, migration, and production
  behavior must not rely on unverified assumptions.

## Next-goal proposal discipline

This section applies when the current goal is reaching completion and the coding agent is
considering what should come next.

Required:

1. A completed goal does not establish an implied roadmap. Finishing one goal does not make
   its most obvious continuation the next approved project priority.
2. Before proposing a next goal, reassess from:
   - the verified current repository state;
   - the user's stated higher-level objectives or milestone;
   - remaining verified gaps;
   - confirmed constraints and intentionally deferred work;
   - the user's latest stated priorities.
3. Do not derive a next goal solely from a previous agent proposal, from what would be a
   technically natural continuation, or from a chain of earlier recommendations.
4. Treat every proposed next goal as an unapproved candidate, not as part of an established
   roadmap. Do not modify goal/action tracking files or begin implementation until the user
   explicitly approves it.
5. A next-goal proposal must explain `Why now`:
   - which stated objective or milestone it advances;
   - which verified gap it addresses;
   - which existing capabilities it can reuse;
   - what assumptions or unknowns remain;
   - why it is a stronger candidate than other known nearby work, when that comparison is
     reasonably supported.
6. Apply the `Evidence and assumptions` rules to roadmap reasoning. Do not present an inferred
   future need as a verified project requirement.
7. If no next goal is strongly supported by current evidence and stated priorities, say so and
   request user direction instead of inventing a continuation.
8. Keep the planning horizon short:
   - the current goal is approved work;
   - the next goal is only a candidate until approved;
   - later directions are ideas only unless the user explicitly asks for a broader roadmap.
9. Do not generate a multi-goal roadmap by default. Prefer one recommended next-goal candidate;
   mention alternatives only when they materially help the user choose.
10. After any future goal is completed, reassess again from current evidence and user priorities.
    Do not automatically continue a previously suggested trail of goals.

The coding agent may show initiative by proposing useful work, but initiative does not grant
roadmap authority. User approval determines project direction.

## Active-goal workflow

This section applies only when the requested task contributes to the active goal.

`docs/current-goal.md` defines the approved outcome, scope, constraints, and completion
criteria. `docs/current-actions.md` defines the approved action sequence and records
progress.

Required:

1. Read both files before changing code.
2. Implement only the action marked `Active`.
3. Update `docs/current-actions.md` with status, progress, discoveries, verification
   evidence, and the next action as work progresses.
4. After implementation and verification, set the action to `Ready for review` and stop.
5. Wait for explicit user approval before marking it `Completed` or activating the next
   action.

Reaching `Ready for review` is a stopping point even when other worthwhile changes are
visible. The coding agent may record issues or propose follow-up actions, but must not
implement them unless they are necessary for correctness or safety or explicitly approved.

### Approval gates

Only an explicit chat instruction from the user may:

- approve the current action or mark it `Completed`;
- activate or begin implementing the next action;
- change approved scope, constraints, or confirmed decisions;
- mark the current goal `Completed` or replace it.

Tool, command, network, or filesystem approvals are not implementation approval.

When the user says `Approve current action`:

1. Confirm that the action is `Ready for review` and its verification evidence is recorded.
2. If verification is incomplete, explain what remains and do not complete the action.
3. Otherwise mark it `Completed` and record a concise completion summary.
4. Keep the next action `Pending`, update `Resume here` to identify it as the prepared next
   action, and stop without activating or implementing it.

When the user requests changes to an action:

1. Set its status to `Changes requested` and record the requested corrections.
2. Make only those corrections and any work required for correctness or safety.
3. Repeat the relevant verification, return the action to `Ready for review`, and stop.

After the last action is approved:

1. Set the goal status to `Ready for final review`.
2. Summarize completed behavior and verification.
3. Compare the result with every `Done when` criterion.
4. Identify unmet criteria and intentionally excluded work, then stop for user approval.

When the user says `Approve current goal`, mark it `Completed` and record its completion
date and outcome. Then apply `Next-goal proposal discipline`: propose a next-goal candidate
only when current evidence and stated priorities support one. Otherwise state that no next goal
is strongly implied and request user direction. Do not replace `current-goal.md` yet.

When the user says `Approve proposed next goal`, treat that approval as authorization for
the goal outcome, not for implementation. First perform the delta-first planning process against
the current repository state and completed related work. Then replace `docs/current-goal.md`
with the approved goal and reset `docs/current-actions.md` with a proposed sequence containing
only the verified delta. The first action remains `Pending`. Stop for action-plan approval
without implementing it.

When the user says `Approve action plan`, set the first `Pending` action to `Active`, update
`Resume here`, and stop without implementing it.

The coding agent may propose goal changes, but must not change user outcomes, scope,
non-goals, security invariants, confirmed decisions, completion criteria, or project direction
without explicit user approval. Overlap with previously completed work is not, by itself,
approval to replace or redesign that work, and a sequence of agent proposals must never be
treated as an approved roadmap.

## Usage and cost reporting

This section applies to every substantive repository task, including planning, implementation,
review, verification, and repository analysis.

This is the source of truth for reporting information from the Codex CLI `/status` command. Here,
`/status` means Codex CLI output only; it is not an HTTP route, page, dashboard, or metric in the
Let's Flex application. Application and dashboard metrics must never be described as Codex usage,
cost, allowance, credits, tokens, or `/status` data.

The goal is to make observed Codex status useful without inventing precision. Official billing or
fully reliable account telemetry is preferred, but its absence must reduce confidence and precision
rather than suppress the report. Report every useful `/status` value or other locally observable
task value that is actually available, and identify each reported value as **Verified**,
**Estimated**, or **Unavailable**.

Classification:

- **Verified** — copied directly from Codex CLI `/status`, a readable screenshot of that CLI
  output attached in the current conversation, a supported non-interactive Codex account/usage
  query, or a local task clock. Preserve CLI text, labels, units, and percentages exactly; do not
  rename a `5h` window to `daily`, convert `used` to `left`, or reinterpret a context/token value
  as billing data.
- **Estimated** or **Approximate** — derived from verified inputs using a formula documented below.
  State the inputs and formula when the derivation is not clear from the compact footer.
- **Unavailable** — not exposed, not safely observable, or lacking a defensible estimate. Showing
  one unavailable field must not hide other available status fields.

### Telemetry collection

Required:

- At the beginning of a substantive task, capture a usage baseline when the current Codex runtime
  exposes account usage telemetry non-interactively.
- Near the end of the task, after implementation and verification but before the final response,
  capture a second snapshot from the same source when possible.
- Prefer telemetry sources in this order:
  1. direct usage/rate-limit data already exposed to the current runtime;
  2. a supported non-interactive Codex account/rate-limit query available in the local runtime,
     such as an `account/rateLimits/read` capability exposed by the Codex app server;
  3. Codex CLI `/status` output available to the agent, including readable screenshots or text
     explicitly supplied by the user in the current conversation;
  4. other local task observations, such as elapsed wall-clock time.
- Do not assume the interactive `/status` slash command can be invoked by the coding agent itself.
  Use it only when its values are already available to the agent or the user explicitly supplies
  them.
- Do not read, print, copy, parse, or expose authentication tokens, cookies, API keys, browser
  credentials, or other secrets in order to obtain telemetry.
- Do not add repository dependencies, application code, external telemetry services, or billing
  API calls solely for usage reporting unless the user explicitly approves that implementation.
- This repository does not collect Codex allowance, task-credit, or billing telemetry; application
  and dashboard metrics are not valid substitutes for that source.
- If a safe non-interactive telemetry query is unavailable, continue the task normally. Report the
  available CLI `/status` fields verbatim; if no CLI output is observable, label only those fields
  `Unavailable` and still report other locally observed information, such as elapsed time.
- When a readable CLI `/status` screenshot is attached during the task, extract every clearly
  legible usage field and carry the latest screenshot's values into the final `Usage` footer as
  **Verified CLI `/status`**. The screenshot is a point-in-time snapshot, not live telemetry; do
  not imply it reflects later consumption. Do not include a session/thread identifier by default,
  because it identifies a session rather than measuring usage.

### Snapshot interpretation

Required:

- Preserve the runtime's actual window labels. For example, report `5h` and `7d` when those are
  the labels shown by Codex; do not rename them `day` and `week` unless the runtime uses those
  labels.
- Preserve each available CLI `/status` percentage, runtime window, reset time, model/provider,
  token/context field, and other telemetry exactly as displayed. A value copied from `/status` is
  **Verified**, even if it is not official billing telemetry.
- For each available limit snapshot, record:
  - percentage remaining or used exactly as shown;
  - reset time/date when available;
  - purchased-credit balance when available.
- Compare before/after allowance values only when they refer to the same usage window. Use the
  reset timestamp/date, when available, to determine whether the window is the same.
- If a limit resets during the task, do not subtract the pre-reset percentage from the post-reset
  percentage. Report `window reset during task` and show the final remaining value instead.
- Percentage consumption is a percentage-point difference in remaining allowance. For example,
  `44% -> 41%` means `3 pp consumed`, not `3% of credits` and not a known number of tokens.
- If the displayed percentage is rounded, treat the calculated delta as rounded telemetry. A
  displayed `0 pp` change does not prove that the task consumed zero usage.
- Treat account telemetry as potentially delayed. If values are unchanged after substantial work,
  report the observed values without inventing a non-zero delta.
- Do not treat context-window usage as billing usage. `Context 91% left`, for example, describes
  the current conversation context capacity and must not be converted into allowance, credits, or
  money. It may still be reported as `Verified context: 91% left` when CLI `/status` exposes it.

### Task credit and cost calculation

Use the current user-confirmed purchase rate until the user explicitly updates it:

`2,500 credits = R$550`, therefore `1 credit = R$0.22`.

Required:

- Calculate task credits from an actual before/after purchased-credit balance only when both
  balances are available and refer to the same account balance:
  `task credits consumed = credits before - credits after`.
- If the credit balance decreases, calculate:
  `estimated purchased-credit cost = task credits consumed × R$0.22`.
- If the runtime directly reports task-level credits, they may be reported as measured task
  credits. Prefer a directly reported task value over an inferred value when the source is clear.
- Never derive task credits from elapsed time, 5h/7d percentage changes, context tokens, model
  averages, task complexity, or generic pricing examples.
- While the task is covered by included plan allowance and purchased credits do not decrease,
  report `purchased credits: unchanged` when the balance is known. Do not assign a BRL charge to
  included allowance usage.
- Treat `R$0.22/credit` as a configurable reporting constant based on the user's current purchase
  screen, not as a permanent product price.

The only permitted monetary estimate under this contract uses the formula above. Its assumptions
are: both balances are verified snapshots of the same purchased-credit balance; the decrease is
attributable to the task unless a concurrent charge is known; and the user-confirmed conversion is
still `R$0.22/credit`. Label the result **Estimated purchased-credit cost** (or **Approximate**),
never official OpenAI billing. If any assumption or input is missing, report `cost: Unavailable`.
Never calculate credits or BRL from elapsed time, allowance percentages, context/tokens, model
averages, task complexity, or generic pricing examples.

### Elapsed time

Preferred:

- Capture a local start timestamp when substantive work begins and a local end timestamp after
  verification, when doing so is reliable and low-overhead.
- Report elapsed time as approximate working time. Do not convert elapsed time into credits or
  allowance consumption.

### Usage footer

Include a compact `Usage` footer for every substantive repository task. It must include all useful
observed CLI `/status` or local task information and label unavailable cost explicitly. A footer
with only unavailable values is allowed only when the agent cannot observe even elapsed time;
otherwise include the observed elapsed time. Do not omit the whole footer merely because official
billing telemetry is absent.

Preferred formats:

`Usage: ~18 min (Verified local clock) · 5h 42% -> 37% (Verified CLI /status; 5 pp consumed; resets 20:05) · 7d 18% left (Verified CLI /status; resets Sep 15) · cost: Unavailable`

`Usage: ~31 min (Verified local clock) · credits 2,500 -> 2,473 (Verified CLI /status; 27 consumed) · Estimated purchased-credit cost: ≈ R$5.94 [27 × R$0.22]`

`Usage: ~30 min (Verified local clock) · daily usage: 8% (Verified CLI /status) · weekly usage: 1% (Verified CLI /status) · cost: Unavailable`

`Usage: ~12 min (Verified local clock) · Context 91% left (Verified CLI /status; not billing data) · cost: Unavailable`

`Usage: Context: 62% left (98,316 used / 258K) (Verified CLI /status) · 5h limit: 92% left (resets 01:15) (Verified CLI /status) · 7d limit: 17% left (resets 15 de set.) (Verified CLI /status) · cost: Unavailable`

If two snapshots describe the same verified allowance window, a percentage-point difference is a
calculation from verified values, not a credit or money estimate. For example, `44% -> 41%` is
`3 pp consumed`; if the window resets, report `window reset during task` instead. Keep reset
information only when useful for deciding whether more work can continue.

For active-goal responses, place the `Usage` footer after `Next decision`. The footer is the only
content permitted after `Next decision`.

## End-of-response workflow options

When working on an action governed by `docs/current-goal.md` and
`docs/current-actions.md`, end every review or status response with a
`Next decision` section followed only by the required `Usage` footer.

Present only options that are valid for the action's current status.
Do not continue to another action until the user explicitly chooses
an option.

### When the action is `Pending approval`

Offer:

- `[Approve action]` — Approve the proposed scope and begin implementation.
- `[Revise action]` — Keep the action pending and revise its plan.
- `[Pause goal]` — Stop work without changing the action's status.

### When the action is `Ready for review`

Offer:

- `[Approve changes]` — Accept the implementation, run final verification,
  mark the action completed if verification passes, and prepare the next
  action without implementing it.
- `[Request changes]` — Keep the current action active and address the
  supplied review findings.
- `[Mark as incomplete]` — Record that the acceptance criteria have not
  been satisfied and explain what remains.
- `[Choose another path]` — Reconsider the current approach without starting
  unrelated implementation.

### When the action is `Completed`

Offer:

- `[Approve next action]` — Approve and implement the prepared next action.
- `[Revise next action]` — Change the proposed scope before implementation.
- `[Pause goal]` — Leave the next action pending.

### Response behavior

- Show the current goal and action status before `Next decision`.
- Give each option a short description of its effect.
- Never interpret silence or an unrelated message as approval.
- Never mark an action `Completed` unless its acceptance criteria have
  verification evidence.
- Never implement a newly prepared action in the same response that completes
  the previous action unless the user explicitly authorized that behavior.
- If the user supplies custom instructions, treat them as `[Choose another path]`
  and confirm any resulting status or scope change.
