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

## End-of-response workflow options

When working on an action governed by `docs/current-goal.md` and
`docs/current-actions.md`, end every review or status response with a
`Next decision` section.

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
