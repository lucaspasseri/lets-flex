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
4. Promote the next `Pending` action to `Active`, update `Resume here`, and stop without
   implementing it.

When the user requests changes to an action:

1. Set its status to `Changes requested` and record the requested corrections.
2. Make only those corrections and any work required for correctness or safety.
3. Repeat the relevant verification, return the action to `Ready for review`, and stop.

After the last action is approved:

1. Set the goal status to `Ready for final review`.
2. Summarize completed behavior and verification.
3. Compare the result with every `Done when` criterion.
4. Identify unmet criteria and intentionally excluded work, then stop for user approval.

When the user says `Approve current goal`, mark it `Completed`, record its completion date
and outcome, propose the next goal in chat, and do not replace `current-goal.md` yet.

When the user says `Approve proposed next goal`, replace `docs/current-goal.md` with the
approved goal, reset `docs/current-actions.md` with a proposed sequence whose first action
is `Pending`, and stop for planning approval.

When the user says `Approve action plan`, set the first `Pending` action to `Active`, update
`Resume here`, and stop without implementing it.

The coding agent may propose goal changes, but must not change user outcomes, scope,
non-goals, security invariants, confirmed decisions, or completion criteria without
explicit user approval.
