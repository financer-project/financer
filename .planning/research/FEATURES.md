# Feature Research

**Domain:** Splitwise-style shared-expense group splitting (feature addition to existing personal-finance app, Financer #67)
**Researched:** 2026-08-21
**Confidence:** MEDIUM (web search, cross-checked across Splitwise official docs/KB, feedback forum, and multiple competitor products — no official API/architecture docs available, so implementation details are inferred from product behavior, not verified source)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist because the feature is explicitly framed as "Splitwise-style." Missing these = feature doesn't read as a splitting group at all.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Create group, add members (registered + non-registered) | Core entry point; a "splitting group" with no members isn't a group | LOW | Organizer must be a registered Financer user (locked decision). Non-registered members are represented by a placeholder identity (name/nickname) tied to their access link. |
| Personal access link per member | Locked decision — this *is* the access model for non-registered members, and doubles as the "no login needed" UX Splitwise-adjacent tools (SplitCost, Splitceipt) increasingly offer | MEDIUM | Must be an unguessable token (e.g. UUID/opaque token in URL), permanent (works after group closes per locked decision), and resolve directly to "this member's" view — no separate login step. Security note: link = full participant credential, must be treated as a bearer secret (not logged, not embeddable in shareable previews that leak via chat unfurling, etc.). |
| Add expense with description, amount, currency, payer(s), date | Baseline data entry; without this there's nothing to split | LOW | Reuses Financer's existing transaction-entry patterns/conventions. Currency is per-entry (locked decision), not group-wide. |
| Equal split across all members | The default, most common split type — expected to be the one-click default | LOW | Divide total by member count; handle remainder-cent distribution deterministically (e.g. first N members absorb the extra cent) to avoid rounding drift. |
| Split across a specified subset of members | Explicitly locked decision; "only some people were at dinner" is the single most common real-world case after equal-split-all | LOW–MEDIUM | UI: toggle members in/out of a given expense's split; recompute equal share among the selected subset. |
| Per-member running balance (who owes whom) | The entire value proposition of a splitting group — without balances, it's just a shared list of expenses | MEDIUM | Balance must be computed transactionally from all expense splits + settlements for a member, in each currency independently. See Feature Dependencies below — this is a derived/computed feature, not stored state (or at minimum must be re-derivable, even if cached). |
| View all group expenses and balances (any member) | Locked decision: full participant access includes "view all expenses and balances" | LOW | Straightforward list/detail view scoped to the group via the access link's implicit identity. |
| Edit/delete own expenses | Locked decision: members can add/edit/delete their *own* expenses | MEDIUM | "Own" needs a clear definition — likely "expenses I created/paid," not "expenses where I'm a split participant." Must decide whether editing recalculates historical balances or is blocked once settlements reference the expense (see Pitfalls-adjacent concern, flag for PITFALLS.md). |
| Record a settlement / "mark as paid" between two members | Locked decision: settle debts, recorded as a "negative expense"; universally present in every competitor researched (Splitwise, SplitCost, Splitsies, Tricount) | LOW–MEDIUM | Implement as a same-shape record as an expense (payer, payee, amount, currency, date) with inverted sign/effect on the balance — reuses the expense data model per the locked "negative expense" decision, rather than a parallel settlement entity. |
| Time-limited group (start/end date), but links still work after close | Explicit locked decision | LOW | "Closed" should stop new expense creation (or at least be a soft/reversible state) but must NOT revoke access links — historical view and settlement recording likely still need to work post-close for stragglers settling up. Clarify in requirements whether adding *new* expenses is blocked once closed, since balances need to always be finally settleable. |

### Differentiators (Competitive Advantage)

Not required for v1.1.0, but valuable additions once table stakes work. Consider only if they don't blow the milestone scope.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Custom split by exact amount or percentage or shares (beyond equal-subset) | Handles "I had the steak, you had the salad" scenarios; standard on Splitwise, SplitEven, Tricount | MEDIUM | Locked decisions only guarantee "all members or a specified subset" (implies equal split among selected subset) — exact/%/shares splitting is a natural v1.x extension of the same split-computation code path, not a new domain concept. Flag as a fast-follow, not core v1.1.0 scope unless explicitly requested. |
| Debt simplification ("settle up faster" / minimize # of transactions) | Reduces friction when many members owe many others; Splitwise's signature feature (e.g. 8 payments → 3) | MEDIUM–HIGH | NP-complete in the general optimal case; a greedy heuristic (match largest creditor/debtor repeatedly, per-currency) is sufficient and matches what Splitwise itself effectively does. Should be presented as a *display suggestion* ("suggested settlements"), not a mutation of raw balances — raw pairwise balances remain the source of truth. Good v1.x candidate once basic per-pair balances work. |
| In-app payment integration (Venmo/PayPal/bank links) | Some competitors integrate real payment rails at settle-up time | HIGH | Explicit out-of-scope territory — Financer is self-hosted personal finance software, not a payments platform; adding real money movement is a major trust/compliance surface. Treat as anti-feature-adjacent (see below) unless the user explicitly requests it later. |
| Optional currency conversion / blended total balance | Some apps (Splitsies) show a single converted total across currencies for convenience | MEDIUM | Directly conflicts with the locked "per-expense currency, no group-wide currency" decision as a *default*, but could be an opt-in display layer later. Requires an FX-rate source (none exists in the codebase per PROJECT.md's open question) — explicitly defer. |
| Group activity feed / comments on expenses | Nice social layer some competitors offer | LOW–MEDIUM | Not requested in locked decisions; low priority, easy to defer without weakening the core value prop. |
| Recurring group expenses | Financer already has recurring transaction infra for households | MEDIUM | Tempting to reuse existing BullMQ recurring infrastructure, but groups are a deliberately separate domain (locked decision) — reusing the recurrence engine across domains adds coupling for a feature not requested. Defer. |
| Receipt scanning / attachment on group expenses | Financer already supports attachments on household transactions | LOW–MEDIUM | Could reuse existing attachment infra, but adds scope; not part of the locked feature set. Defer to v1.x if requested. |

### Anti-Features (Commonly Requested, Often Problematic — Explicitly Avoid for v1.1.0)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Real-money payment processing / in-app settle-up transfers | "Just let me pay them from the app" — seems like the natural finish to settle-up | Turns a self-hosted finance tracker into a regulated money-transmission surface; huge trust, compliance, and security scope explicitly outside this milestone and outside Financer's stated identity | Keep settle-up as a *record of a payment that happened elsewhere* (cash, bank transfer, Venmo, etc.) — matches the locked "negative expense" model exactly, no external integration needed |
| Single group-wide currency with forced conversion on entry | Simpler mental model, some competitors default to it | Directly contradicts the locked decision (per-expense currency); forces an FX-rate dependency Financer doesn't have; loses precision/intent of the original transaction | Track balances per currency pair per member (locked approach); surface multiple currency lines per relationship rather than one blended number |
| Sharing group/account data model with Households | Reuse existing accounts/categories/permissions — looks like less work | Explicitly locked out of scope: entangles the public-link, non-registered-user access model with the household security/permission boundary (CASL abilities, OWNER/ADMIN/MEMBER/GUEST roles) — a real security risk, not just tech debt | Fully separate domain/data model for Groups, as already decided; at most share generic UI primitives (forms, tables), not data/permission model |
| Allowing anonymous (non-logged-in) users to *create* groups | "Let anyone spin up a quick split without signing up," lowers friction | Explicitly locked out of scope: removes accountability for group organizers, opens abuse/spam vector (anonymous group creation at scale), complicates ownership/deletion semantics | Only registered users organize; members join/participate via personal link without ever needing to register (this is the actual friction-reduction lever, already covered by the personal-link design) |
| Auto-expiring or one-time-use group links | Seems more "secure" by limiting exposure window | Explicitly contradicts locked decision that links must keep working permanently, even after group close — breaking this would block the very common "settle up weeks after the trip ended" case | Permanent, non-expiring per-member links; rely on unguessable token length/entropy for security, not expiry |
| Forced optimal (exact minimum) debt-simplification algorithm | "Give me the mathematically fewest transactions" | NP-complete in general; chasing exact optimality is a rabbit hole with poor ROI versus a good greedy heuristic that's what real products (including Splitwise itself) actually ship | If/when built (v1.x differentiator), use a greedy largest-creditor/largest-debtor heuristic per currency; don't over-invest in exact optimization |

## Feature Dependencies

```
Group creation (registered organizer)
    └──requires──> Registered-user auth (already exists in Financer)

Member + personal access link
    └──requires──> Group creation
    └──enables──> All per-member participant actions below (link IS the auth mechanism)

Add expense (with currency, payer, split type)
    └──requires──> Member + personal access link
    └──requires──> Split computation (equal-all / equal-subset)

Per-member running balance (per currency)
    └──requires──> Add expense (all expenses in the group)
    └──requires──> Settlement records ("negative expense")
    └──is a derived/computed view over──> expenses + settlements, NOT independently stored truth

Settlement ("settle debts")
    └──requires──> Per-member running balance (to know what's owed)
    └──reuses data shape of──> Add expense (negative/inverted expense)

Debt simplification (differentiator, v1.x)
    └──requires──> Per-member running balance (per currency)
    └──enhances──> Settlement UX (suggests fewer payments; does not replace raw balances)

Custom split by %/shares/exact amount (differentiator, v1.x)
    └──enhances──> Add expense's split computation
    └──does NOT require──> anything beyond equal-subset split (same code path, more input modes)

Time-limited group (start/end)
    └──constrains──> Add expense (block new expenses once closed — confirm in requirements)
    └──does NOT constrain──> Personal access link validity (must remain permanent per locked decision)
```

### Dependency Notes

- **Per-member running balance requires Add expense + Settlement:** balance is a derived aggregate (sum of split-shares owed minus settlements paid, per currency, per member-pair or per-member-net). This should be planned as a computation/query concern early — it's the feature all other UX (view balances, settle up, simplify debts) sits on top of. Get the split → balance computation right before layering settle-up or simplification on it.
- **Settlement reuses Add expense's data shape ("negative expense"):** per the locked decision, don't build a separate Settlement entity/table if it can be modeled as an expense-like record with inverted effect. This keeps the balance-computation logic single-pathed (one query sums all expense-like records, splits and settlements alike) rather than requiring a UNION of two data models.
- **Personal access link enables all per-member actions:** the link isn't just a convenience — it *is* the authorization boundary for non-registered members (no separate login exists for them). Every participant action (add/edit/delete own expense, view all, settle) must be gated through "does this link resolve to a valid, non-revoked member of this group," analogous to how household actions are gated through CASL abilities today, but a structurally different (token-based, not session-based) mechanism.
- **Debt simplification enhances, doesn't replace, settlement:** raw per-currency pairwise balances must remain the source of truth and always be independently reconstructable; simplification is a display/suggestion layer computed on top, never a stored mutation of balances. This avoids the correctness risk of two competing balance representations.
- **Time-limited group vs. permanent links (tension to resolve in requirements):** the locked decisions establish both "groups can be time-limited" and "links keep working after the group closes." The open design question is what "closed" actually restricts — most likely: no new expenses can be added, but viewing, settling existing debts, and using the link stays fully available. This should be nailed down as an explicit requirement, not left implicit, since it affects the group/expense state model.

## MVP Definition

### Launch With (v1.1.0)

Minimum viable product — matches the locked decisions exactly, nothing more.

- [ ] Registered user creates a group (name, optional start/end period)
- [ ] Organizer adds members (registered or by name/placeholder for non-registered), each gets a permanent personal access link
- [ ] Any member (via link) adds an expense/income entry: description, amount, currency, payer, date
- [ ] Split expense equally across all members, or equally across a specified subset
- [ ] Any member (via link) edits/deletes their own expenses
- [ ] Any member (via link) views all group expenses and running balances
- [ ] Per-currency running balance per member, computed from expenses + settlements
- [ ] Record a settlement ("negative expense") between two members, per currency
- [ ] Group can be marked time-limited (start/end); closing behavior (blocks new expenses, links stay live) explicitly defined in requirements

### Add After Validation (v1.x)

Features to add once the core group/expense/balance loop is working and used.

- [ ] Custom split by exact amount, percentage, or shares (beyond equal-subset) — trigger: users request finer-grained splits once basic groups are in daily use
- [ ] Debt simplification / "suggested settlements" — trigger: groups with >4-5 members start generating enough criss-crossing balances that manual settle-up feels tedious
- [ ] Optional blended/converted balance display across currencies — trigger: only if/when an FX-rate source is introduced elsewhere in Financer (per PROJECT.md's open question)

### Future Consideration (v2+)

Features to defer until the core splitting feature has proven adoption.

- [ ] Recurring group expenses — why defer: couples groups to the recurring-transaction engine built for a different domain (households); not requested
- [ ] Receipt scanning/attachments on group expenses — why defer: nice-to-have, existing attachment infra could be reused later without redesigning the core feature
- [ ] In-app real payment integration — why defer: out of scope for a self-hosted finance tracker; major compliance/trust surface
- [ ] Group activity/comments feed — why defer: social layer, not core to the "track and settle shared expenses" value proposition

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Group creation + members + personal access links | HIGH | MEDIUM | P1 |
| Add expense (currency, payer, date) | HIGH | LOW | P1 |
| Equal split (all / subset) | HIGH | LOW–MEDIUM | P1 |
| Per-currency running balance | HIGH | MEDIUM | P1 |
| View all expenses/balances via link | HIGH | LOW | P1 |
| Edit/delete own expense | MEDIUM | MEDIUM | P1 |
| Settlement ("negative expense") | HIGH | LOW–MEDIUM | P1 |
| Time-limited group + close semantics | MEDIUM | LOW | P1 |
| Custom split (%/shares/exact) | MEDIUM | MEDIUM | P2 |
| Debt simplification | MEDIUM | MEDIUM–HIGH | P2 |
| Currency conversion/blended balance | LOW | MEDIUM | P3 |
| Recurring group expenses | LOW | MEDIUM | P3 |
| Receipt scanning on group expenses | LOW | LOW–MEDIUM | P3 |
| In-app payment integration | LOW (for this product) | HIGH | Do not build |

**Priority key:**
- P1: Must have for v1.1.0 launch (matches locked decisions)
- P2: Should have, add when possible (v1.x fast-follow)
- P3: Nice to have, future consideration (v2+)

## Competitor Feature Analysis

| Feature | Splitwise | SplitCost / Splitceipt | Our Approach (Financer Groups) |
|---------|-----------|-------------------------|----------------------------------|
| Non-member access | Add by email/phone → creates a shadow account in Splitwise's own system | Pure shareable link, no account, browser-based, name-only selection | Permanent personal access link per member, no account required — closest to SplitCost/Splitceipt's model, more durable than a one-off link since it stays valid indefinitely |
| Split types | Equal, exact amount, percentage, shares; default unequal split can be saved per group | Simpler — mostly equal split with per-person adjustment | v1.1.0: equal across all or a subset (locked scope); exact/%/shares deferred to v1.x |
| Currency | Per-currency balances shown separately, no forced conversion | Not a strong differentiator in these tools | Per-expense currency (locked decision) — matches Splitwise's "don't force conversion" philosophy, taken further (currency lives on the expense, not just the balance display) |
| Settle up | Record external payment, or pay via integrated rails (Splitwise Pay, Venmo, PayPal) in supported regions | Guests "mark their own repayment" via link, no payment rails | Record-only settlement modeled as a "negative expense" (locked decision) — no payment rails, matches Financer's self-hosted, no-external-money-movement identity |
| Debt simplification | Signature feature (network-flow/greedy heuristic), toggleable | Not typically offered | Deferred to v1.x as a display-layer suggestion on top of raw per-currency balances |
| Group lifecycle | Groups are generally persistent (no built-in "close" concept) | Some tools (Splitceipt) are framed around one-off bills, not persistent groups | Time-limited groups with explicit start/end and defined close semantics (locked decision) — a genuine point of departure from Splitwise's always-open groups |

## Sources

- [Splitwise: Can I split an expense by percentages?](https://feedback.splitwise.com/knowledgebase/articles/77463-can-i-split-an-expense-by-percentages) — MEDIUM confidence (official Splitwise help content)
- [How to design Splitwise? — Machine Coding Round Questions](https://workat.tech/machine-coding/editorial/how-to-design-splitwise-machine-coding-ayvnfo1tfst6) — MEDIUM confidence (third-party technical breakdown of split types)
- [Algorithm Behind Splitwise's Debt Simplification Feature — Medium](https://medium.com/@mithunmk93/algorithm-behind-splitwises-debt-simplification-feature-8ac485e97688) — MEDIUM confidence (independent technical analysis, cross-checked against multiple similar write-ups)
- [I Finally Understood Ford–Fulkerson by Solving Splitwise's "Simplify Debts" — DEV Community](https://dev.to/ayush-k-anand/i-finally-understood-ford-fulkerson-by-solving-splitwises-simplify-debts-2dnp) — MEDIUM confidence (independent technical analysis)
- [What is Simplify Debts? — Splitwise KB](https://splitwise.uservoice.com/knowledgebase/articles/107220-what-does-the-simplify-debts-setting-do) — MEDIUM confidence (official Splitwise help content)
- [SplitCost vs Splitwise: A Smarter Free Alternative](https://www.splitcost.in/en/splitwise-alternative) — MEDIUM confidence (vendor marketing content, but consistent with independently observed guest-link patterns)
- [Split a Bill With Friends Without an App — Splitceipt](https://splitceipt.com/blog/split-bill-with-friends-no-app/) — MEDIUM confidence (vendor content describing their own guest-link UX)
- [How can I manage a friendship or group with multiple currencies? — Splitwise KB](https://kb.splitwise.com/balances-and-expenses/how-can-i-manage-a-friendship-or-group-with-multiple-currencies) — MEDIUM confidence (official Splitwise help content)
- [How to Record Payment on Splitwise — HardReset.info](https://www.hardreset.info/devices/apps/apps-splitwise/record-payment/) — MEDIUM confidence (third-party how-to, consistent with Splitwise's own documented settle-up behavior)
- [Evaluating Splitwise's interface and its influence on group dynamics — Medium](https://medium.com/@nidhibhat.1098/evaluating-splitwises-interface-and-its-influence-on-group-dynamics-f6f1f3ef1355) — LOW–MEDIUM confidence (informal UX critique, used only for corroborating detail, not as a primary claim source)

**Confidence caveat:** No official Splitwise engineering documentation or API spec was available; findings are synthesized from official help-center articles, independent technical write-ups (multiple, cross-checked), and competitor marketing/product pages. Treat split-type terminology and settle-up mechanics as reliable (well-corroborated across sources); treat the debt-simplification algorithm's exact internals as approximate (Splitwise doesn't publish its implementation — the network-flow/greedy characterization is the community's reverse-engineered consensus, not confirmed by Splitwise itself).

---
*Feature research for: Splitwise-style shared-expense group splitting (Financer #67, v1.1.0)*
*Researched: 2026-08-21*
