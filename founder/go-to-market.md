<!-- /founder:go-to-market · 2026-10-28 · input: Review iHealth HapIsabela for ideathon judges and demo reviewers. -->

# iHealth HapIsabela: judge-first introduction plan

Assumption: The event deadline, judging rubric, presentation length and submission portal are not supplied. Use the relative schedule below and substitute the event's published requirements.

Assumption: The near-term goal is a convincing demonstration and useful reviewer feedback. No public patient onboarding or real clinical operation is planned.

Assumption: Targets and costs below are planning estimates, not existing traction, pricing, or measured acquisition performance.

## Positioning and readiness

Lead with: **“One planned referral, one shared next step, from referring facility to receiving team to patient.”**

The strongest proof is Ana's journey across views: the same referral appears in the right workspace, an unavailable doctor triggers coordinated agreement, receiving staff confirm the plan, and the patient sees the next step. The map supports that story. Presenting only a map makes the work look like a facility directory.

Minimum demonstration: synthetic facility discovery; one immutable submitted snapshot; guarded staff actions; accepted alternative; patient confirmation; staff identity verification; separate return note; persistence/reset; honest routing fallback. Use DEMO_SCRIPT.md. Demo-readiness depends on the actual results in VERIFICATION.md, not on this strategy document.

Largest launch risk: reviewers infer a live operational system from a polished prototype. Keep local-demo, fictional-site and straight-line labels visible. State that the next milestone is workflow validation with willing staff, followed by a separately scoped trusted backend.

Audience sanity check: use the event's actual judge and mentor count. Estimate: five independent rehearsal reviewers, each giving two observations, produce ten concrete issues to prioritize. That is more useful at this stage than an invented citywide patient market size.

## Two-week preparation

| Time         | Action                                                                                         | Proof to prepare                                          |
| ------------ | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| D-14 to D-10 | Ask the organizer for the rubric and demo constraints. Rehearse with two uninvolved reviewers. | A timed walkthrough and their actual observations         |
| D-9 to D-6   | Test on the presentation laptop, phone width, denied geolocation and failed tiles.             | Verification report and a clean reset                     |
| D-5 to D-3   | Record a 3-minute fictional-data demo. Prepare a 30-second fallback clip.                      | Local video files, captions and readable cursor movements |
| D-2          | Run the story with three fresh reviewers. Ask what is confirmed and what is simulated.         | Comprehension notes, no invented testimonials             |
| D-1          | Freeze the demo build; rehearse reset and recovery.                                            | Working local copy, README and known limitations          |

Waitlist: no patient waitlist. If the event permits follow-up, offer an optional reviewer feedback form collecting role and permission to reconnect. Do not ask for medical information.

Demo-page structure, if the team later requests one: problem and user; four-view story; short video; what works today; what is simulated; verification; feedback invitation; Team Claudex credit. A new marketing page is not needed to finish this prototype.

Pre-demo content drafts to adapt, not published:

1. LinkedIn: “Why a referral needs an agreed plan, not just a destination pin.” Show the requested-versus-confirmed state.
2. LinkedIn: “What happens when the requested doctor is unavailable?” Show the two-facility acceptance loop.
3. YouTube unlisted demo: “iHealth HapIsabela: a fictional planned referral in three minutes.”
4. DEV article: “Keeping straight-line distance separate from road routes in a referral prototype.” Include the fallback and implementation lessons.

Use real rehearsal observations with permission. Testimonial placeholder: [Reviewer quote about what was understandable or confusing, with permission]. Do not convert a reviewer into a customer or healthcare partner.

## Demo day and the three useful platforms

Primary distribution is the event's own submission channel, subject to its actual rules. Prepare the story around the allotted time, not a generic social-media launch hour.

1. **YouTube unlisted:** share the backup demo link only where the event accepts video links. Keep a local MP4 in case internet fails. Unlisted is not confidential: anyone with the link can view and reshare it. Include only fictional information. [YouTube visibility guidance](https://support.google.com/youtube/answer/157177?hl=en)
2. **GitHub:** if the team chooses to share code, provide exact run commands, demo script, verification and limitations. Choose visibility intentionally; nothing has been published by this work. Keep feedback in the project's own Issues or Discussions, not unsolicited promotional threads elsewhere. [Repository visibility](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility), [Community guidelines](https://docs.github.com/en/site-policy/github-terms/github-community-guidelines)
3. **LinkedIn:** after event permission and any embargo, publish one short demo post: local problem hypothesis, 30-second clip, what was implemented, boundaries, one request for workflow feedback. Tag only actual contributors or organizers with their agreement. Represent identity, affiliations and results accurately. [Professional community policies](https://www.linkedin.com/legal/professional-community-policies)

Do not spend the first launch on Product Hunt, X engagement campaigns or broad patient-facing Reddit promotion. The first audience is the event's reviewers. Answer technical and operational questions candidly; do not request votes or manufacture endorsement.

## Channel ranking for the next 90 days

CAC is not meaningful before an operational product and paying-customer definition exist. Below, “cost” means estimated cash cost per completed reviewer session, excluding founder time. Arithmetic assumption: $0 to $100 spent for five completed sessions gives $0 to $20 per session.

| Rank | Channel                                                    | Estimated cost/session | First useful result | This week's action                                      |
| ---- | ---------------------------------------------------------- | ---------------------- | ------------------- | ------------------------------------------------------- |
| 1    | Event judging and mentor sessions                          | $0 to $20              | Event week          | Obtain rubric and rehearse the full story               |
| 2    | Faculty or adviser introductions to willing referral staff | $0 to $25              | 1 to 3 weeks        | Request two voluntary workflow reviews; no real records |
| 3    | Existing team network on LinkedIn                          | $0 to $20              | 1 to 3 weeks        | Prepare the honest 30-second proof clip                 |
| 4    | GitHub project review                                      | $0 to $10              | 1 to 4 weeks        | Package the reproducible source and failure cases       |
| 5    | DEV technical discussion                                   | $0 to $20              | 2 to 6 weeks        | Draft one useful GIS/workflow lesson with a question    |

Days 1 to 30: record judge feedback, fix demonstrated misunderstandings, and complete five review sessions. Days 31 to 60: compare the proposed flow with at least two real staff descriptions using no patient records. Days 61 to 90: decide whether evidence supports a limited, separately approved pilot-design phase. Do not infer deployment authorization from positive feedback.

Five useful content topics and reuse:

- “How planned referrals move between facilities”: event explainer; reuse as the demo intro.
- “Requested destination versus confirmed destination”: LinkedIn card; reuse as a judge FAQ.
- “When a preferred doctor is unavailable”: video segment; reuse as a workflow test case.
- “Straight-line distance versus road distance”: DEV lesson; reuse in README routing guidance.
- “What a browser-only health prototype cannot promise”: GitHub limitations; reuse in Q&A.

## Communities and possible collaborators

Verified activity and rules checked on 2026-10-28. These are technical-feedback communities, not verified channels to local patients or clinicians:

- [DEV #discuss](https://dev.to/t/discuss): current dated discussions; ask a focused implementation question and follow the [code of conduct](https://dev.to/code-of-conduct), including AI-assistance disclosure.
- [Hacker News Show HN](https://news.ycombinator.com/shownew): active new submissions. Consider later only if people can try a substantive project and the team can discuss its work. Its [guidelines](https://news.ycombinator.com/showhn.html) reject landing pages and vote solicitation. Not a priority for this ideathon.
- [GitHub Community](https://github.com/orgs/community/discussions): active technical support discussions. Use for relevant GitHub workflow questions, not healthcare-product advertisements; keep project promotion in the team's own repository.

Potential collaboration, neither established nor endorsed: one willing referring clinician and one receiving registration/referral staff member to review handoff assumptions; a local faculty/community-health adviser to assess language and staff-assisted printing. Names, permission and participation remain [to confirm].

Product-specific tactic: give a reviewer two windows, one referring and one receiving. Let them make the alternative-doctor decision and watch the patient update. This exposes the coordination value faster than explaining dashboard features.

## Five metrics and budget

Targets below are internal goals, not evidence of clinical benefit. Measure with an anonymous rehearsal tally and a project issue log. Do not add clinical analytics to the prototype.

| Metric                                                | Day 30 | Day 60 | Day 90 | If below target                                                 |
| ----------------------------------------------------- | ------ | ------ | ------ | --------------------------------------------------------------- |
| Independent completed review sessions                 | 5      | 10     | 15     | Shorten the session and use adviser introductions               |
| Reviewers who explain the core handoff unaided        | 4/5    | 8/10   | 12/15  | Rewrite the opening and show role switching earlier             |
| Reviewers distinguishing demo/real routing correctly  | 5/5    | 10/10  | 15/15  | Increase labels and repeat the fallback demonstration           |
| Rehearsals completing Ana's story within four minutes | 4/5    | 8/10   | 12/15  | Remove optional detours and fix friction                        |
| Qualified workflow-review follow-up commitments       | 2      | 4      | 6      | Ask one specific operational question, not for generic interest |

Start at $0: local runnable demo, existing laptop, built-in recording and manual feedback log. No paid ads. Optional monthly ceiling: $100 reviewer connectivity/transport, $40 printed reference cards, $30 presentation adapter/cable, $30 contingency. These are estimates, not quotes. Keep the remaining $300 of a $500 ceiling unspent until a verified need appears. Best optional purchase under $200: a reliable backup presentation connection/adapter if rehearsals reveal display failure; first borrow equipment and test it.

Saved plan: `founder/go-to-market.md`. Useful next workflows: `pitch-deck` and `user-interviews`.
