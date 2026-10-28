---
version: alpha
name: iHealth HapIsabela
description: A calm, map-led workspace for fictional planned referrals in Isabela City.
colors:
  primary: "#245bcc"
  primary-hover: "#1848ac"
  blue-soft: "#edf3ff"
  ink: "#20304b"
  muted: "#637089"
  surface: "#ffffff"
  canvas: "#f5f7fb"
  line: "#e0e6ef"
  yellow: "#f3c653"
  yellow-soft: "#fff8e3"
  red: "#b42335"
  green: "#207451"
typography:
  body:
    fontFamily: '"Segoe UI", Arial, sans-serif'
  display:
    fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif'
  reference:
    fontFamily: "ui-monospace, monospace"
rounded:
  DEFAULT: "14px"
  control: "8px"
spacing:
  page: "36px"
  phone: "16px"
  panel: "24px"
components:
  button: {}
  facility-card: {}
  dialog: {}
  timeline: {}
---

# iHealth HapIsabela design system

## Overview

The visual reference is a community care coordination desk: readable records beside a local map, with the referral connection as the signature. Product register throughout. Audience: patients on phones and referring/receiving staff at a desktop in Isabela City, Basilan, Philippines. Source: Prompt 1 in the supplied prototype brief. English UI, en-PH dates, Asia/Manila timestamps. This is planned non-emergency care, never dispatch or clinical decision support. No Japanese locale or Japan market scope.

The restrained creative move is a connected referral path: distinct facility pins, a six-step progress line, and a shared record across personas. Avoid stock medical photography, hospital endorsements, marketing charts, dark command centers, and fabricated geographic paths. The supplied logo in `public/logo/Cl4ud3x_StartupLogo_PSC11.png` defines the brand symbol: interlocking teal, navy, and yellow loops around a red medical cross. `public/logo/mark.png` contains the text-free symbol. The shared `BrandLogo` component owns its app presentation, and favicon/install icons derive from that same mark through `scripts/generate-icons.mjs`. Preserve its colors and proportions; show it without a colored tile or embedded wordmark. Adjacent product names remain ordinary accessible text. Facility and action icons retain their semantic meanings.

Runtime ownership: `src/app/globals.css` is the canonical token source. This document mirrors its accepted tokens. `:root --primary`, `--primary-hover`, `--blue-soft`, `--ink`, `--muted`, `--surface`, `--canvas`, `--line`, `--yellow`, `--yellow-soft`, `--red`, and `--green` map directly to corresponding color keys above. Font tokens map to `--font-body` and `--font-display`; radius DEFAULT maps to `--radius`. Buttons, focus rings, links, panels, badges, and navigation consume those variables. Map marker HTML uses the same CSS classes. Road routes use the primary blue and provider geometry; loading or failures show no connecting line. `tests/domain.test.ts` verifies color and font drift.

## Colors

Blue owns safe primary actions, selection, and confirmed navigation. Yellow highlights coordination needs and explicit demo warnings. Red identifies validation failures and cancellation/decline. Green marks receiving confirmation and visit completion. Each status also has words and an icon; markers differ in both symbol and shape. Light surfaces support outdoor phone use. Forced colors remain system-operable.

## Typography

Trebuchet MS brings a rounded humanist voice to headings and wordmark. Segoe UI supports readable working screens without font downloads. Monospace references are visibly distinct from names. Body 14px desktop, form controls 14px; phone inputs use 16px to avoid mobile focus zoom. Dense utility captions are secondary. Headings scale from 32px to 27px on phones; the entry headline is 58px/43px. Use sentence case and direct actions. No decorative prose in care instructions.

## Layout

Desktop patient discovery uses a 355px facility column and a flexible map with a minimum height of 575px. At 680px and below, map and list stack, with a 355px map. Patient navigation becomes bottom navigation below 940px. Staff sidebar is 226px and becomes a menu at 940px. Forms use natural page scrolling, never a table's height restriction. Staff tables have a card alternative at 680px; the overview table has local horizontal scrolling. Main page gutters are 36px desktop and 16px phone. Panels use 24px spacing, 20px on phones. Eight-point spacing guides major groups, with tighter 4px/6px detail alignment where readable.

## Elevation & Depth

Records use fine borders, not ornamental shadows. The map has elevated floating controls and visible attribution; details stay below the map rather than covering controls. Dialogs alone use a substantial shadow and dimmed backdrop. Navigation and toast placement reserve space. No animated map flights are needed.

## Shapes

Containers use a 14px radius; controls 8px. Avatar circles identify people, facility icons use soft squares, and markers use distinct shapes. Do not use pills for every label. Progress dots represent ordered stages only.

## Components

Navigation uses task names such as Referral overview, All referrals, and Referral details. The optional `DemoGuide` is a compact surface with one next navigation action, a six-step position, and plain instructions for the current handoff. It reads the actual record status; it never simulates completion. App entry recommends the guide and retains four independent role cards. Current-view labels and persistent phone navigation orient the presenter. Staff actions appear before the long record and use one suggested primary action. The logo, palette, and semantic facility icons remain consistent across these views.

Shared owners are in `src/components/ui.tsx`: Modal, Field, Select, SearchBox, Notice, Empty, StatusBadge. Modal uses native dialog with app-owned content, focus containment, Escape, scroll locking, and focus restoration. Select and date input deliberately use native platform popups. Buttons use shared `.button` intent classes; errors stay inline. Busy submissions have duplicate guards. Form labels wrap controls, errors are associated with fields, and invalid submissions focus a correction target. Native browser validation bubbles are disabled.

Search clears immediately and restores focus. Small fixture lists filter locally. Selected cards and map pins refer to the same facility; filters remove invisible selections. Badges use text and icons. Device coordinates stay in transient tab memory. Limited motion is 150ms color/hover feedback; reduced motion disables transitions. No fabricated charts or outcome metrics.

Presenter Mode extends the existing DemoGuide rather than adding a second workflow. At desktop widths of 1100px and above it uses the full workspace, removes the staff sidebar, and raises primary copy/controls to 15–16px, page headings to 36px, and guide headings to 26px. Below that breakpoint it keeps the established mobile navigation and stacks doctor-plan cards. It is opt-in, transient view state; the supplied logo and semantic tokens stay intact. Demo indicators, reference/status, map attribution, and honest route labels remain visible. The shared DoctorPlan panel uses three ordered cards: original preference, coordinated alternative, and receiving confirmation. Only stored staff actions can make the final card confirmed.

## Do's and Don'ts

- Do keep the destination requested distinct from the confirmed destination.
- Do pair each kilometer value with straight-line or road distance.
- Do preserve the immutable submitted snapshot and place changes in addenda.
- Do keep maps useful when tiles fail and offer a list and demo starting point.
- Don't equate opening hours or availability with an accepted appointment.
- Don't style local persistence as hospital delivery or production authorization.
