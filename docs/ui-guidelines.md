# UI Guidelines

These rules apply to user-facing UI, EJS, CSS, component, icon, accessibility, and
interaction changes.

## Visual direction

**Preferred:** Preserve Let’s Flex’s dark, focused, energetic visual language unless an
explicit, deliberate design decision changes it.

Current palette:

- background: `#0b0c10`;
- surface: `#16181d`;
- primary: `#e63946`;
- accent: `#2ec4b6`;
- text: `#e5e7eb`;
- border: `#2a2d34`.

Prefer darker gradients, restrained primary-color use, and existing semantic colors over
arbitrary additions.

## Consistency

**Preferred:** Reuse shared EJS components, form controls, and icons. Extend established
components when practical, and keep spacing, typography, control sizes, and interaction
states consistent.

**Required:** Do not redesign unrelated areas during a focused change. Avoid competing
hover animations, such as translating both a card and a control inside it.

## Accessibility and states

For each user-facing component touched by a change, implement and verify the applicable
behavior:

- semantic HTML;
- keyboard access and visible focus;
- correct labels and accessible names;
- ARIA only when native semantics are insufficient;
- adequate color contrast and no status communicated through color alone;
- clear validation and error feedback;
- reduced-motion support when animation is introduced or changed;
- relevant default, hover, focus, active, disabled, loading, empty, validation-error,
  success, and destructive states.

Icon-only buttons require an accessible text label. Tabs and accordions must expose their
selected or expanded state.

When a modal is added or changed, it must provide focus movement into the modal, focus
trapping, background inertness, scroll locking, focus restoration, and Escape-to-close
when appropriate.

The task does not require auditing or remediating every pre-existing component. Treat a
broader accessibility audit as a separate action unless it is necessary for the requested
change to be correct or safe.

## Motion and responsive design

**Preferred:** Use motion to communicate navigation, hierarchy, or state rather than as
decoration. Prefer naturally adaptive layouts before adding narrow breakpoints.

**Required when applicable:** Do not make essential behavior depend solely on a transition
event; provide a fallback. Verify changed UI at representative small and large viewport
sizes.
