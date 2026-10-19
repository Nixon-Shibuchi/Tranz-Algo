"""Generate Tranz-Algo viva preparation Word documents (as-built)."""

from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor


OUT_DIR = Path(__file__).resolve().parent


def set_run_font(run, size=11, bold=False, italic=False, color=None):
    run.font.name = "Calibri"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color:
        run.font.color.rgb = color


def add_heading(doc, text, level=1):
    h = doc.add_heading(text, level=level)
    for run in h.runs:
        set_run_font(run, size=16 if level == 1 else 13, bold=True)
    return h


def add_para(doc, text, bold=False, italic=False, size=11, space_after=8):
    p = doc.add_paragraph()
    run = p.add_run(text)
    set_run_font(run, size=size, bold=bold)
    run.italic = italic
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.space_before = Pt(0)
    return p


def add_bullet(doc, text, bold_prefix=None):
    p = doc.add_paragraph(style="List Bullet")
    if bold_prefix:
        r1 = p.add_run(bold_prefix)
        set_run_font(r1, bold=True)
        r2 = p.add_run(text)
        set_run_font(r2)
    else:
        r = p.add_run(text)
        set_run_font(r)
    p.paragraph_format.space_after = Pt(4)
    return p


def add_qa(doc, q, a):
    add_para(doc, f"Q: {q}", bold=True, space_after=4)
    add_para(doc, f"A: {a}", space_after=12)


def build_tech_and_qa():
    doc = Document()

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = title.add_run("Tranz-Algo — Technology Change Justification & Likely Viva Q&A")
    set_run_font(r, size=16, bold=True)

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = sub.add_run(
        "Final Year Project · University of Zambia · Computing and Informatics\n"
        "Nixon Shibuchi · Musonda Katongo\n"
        "Updated to match as-built MVP (PostgreSQL + two short demos)"
    )
    set_run_font(r, size=11, italic=True)
    add_para(
        doc,
        "Use this document to explain stack decisions calmly. Prefer “justified design change” "
        "language — not “excuse.”",
        italic=True,
    )

    add_heading(doc, "1. One-sentence viva answer (memorise this)", 1)
    add_para(
        doc,
        "“We kept FastAPI, JWT, FX integration, and the costing/inventory logic as proposed. "
        "We delivered the admin UI as a React web app so we could finish and evaluate the "
        "landed-cost engine reliably. Persistence is PostgreSQL locally (cloud Postgres via "
        "DATABASE_URL when needed), with SQLite as a zero-setup fallback. React Native remains "
        "an optional companion, not a blocker for the project aim.”",
        italic=True,
    )

    add_heading(doc, "2. What the original proposal stated vs what we built", 1)
    table = doc.add_table(rows=1, cols=3)
    table.style = "Table Grid"
    hdr = table.rows[0].cells
    hdr[0].text = "Area"
    hdr[1].text = "Proposal"
    hdr[2].text = "Actual MVP"
    for c in hdr:
        for p in c.paragraphs:
            for run in p.runs:
                set_run_font(run, bold=True, size=10)

    rows = [
        ("Backend", "Python + FastAPI", "Python + FastAPI (same)"),
        ("Auth", "JWT", "JWT (same)"),
        ("Frontend", "React Native / Expo", "React frontend (Vite)"),
        (
            "Database",
            "PostgreSQL (Supabase)",
            "PostgreSQL local (Docker or Windows install); SQLite fallback; cloud URL ready",
        ),
        ("FX", "Real-time exchange API", "On-demand Frankfurter + fallback + manual/cache"),
        ("Hardware", "Laptop + smartphone with camera", "Laptop for demo; phone not required for MVP"),
        ("Architecture idea", "Three-tier", "Still three-tier: UI → API → SQL persistence"),
        (
            "Demo path",
            "Generic examples",
            "Two short demos: grocery Already-Local + phone parts Auto FX",
        ),
    ]
    for a, b, c in rows:
        cells = table.add_row().cells
        cells[0].text = a
        cells[1].text = b
        cells[2].text = c
        for cell in cells:
            for p in cell.paragraphs:
                for run in p.runs:
                    set_run_font(run, size=10)

    add_heading(doc, "3. Frameworks used in this project (plain English)", 1)
    add_para(
        doc,
        "A framework is a ready-made structure you build on (not the business formulas themselves). "
        "In Tranz-Algo each piece has a clear job in the three-tier design.",
    )

    add_heading(doc, "3.1 Backend frameworks / libraries", 2)
    add_bullet(
        doc,
        "Python web framework that exposes REST endpoints under /api/v1 (auth, products, shipments, "
        "FX, inventory, admin). Routers stay thin; they call services for costing and commit. "
        "Also gives automatic OpenAPI docs at /docs for checking the API.",
        "FastAPI — ",
    )
    add_bullet(
        doc,
        "ASGI server that actually runs the FastAPI app (uvicorn … :8000). It is the process that "
        "listens for HTTP from the React frontend.",
        "Uvicorn — ",
    )
    add_bullet(
        doc,
        "data shapes and validation for request/response bodies (create shipment, costs, True Cost "
        "payloads). Bad numbers or missing fields fail early with clear errors instead of corrupting "
        "the database.",
        "Pydantic — ",
    )
    add_bullet(
        doc,
        "Object-Relational Mapper: Python classes in models/ map to PostgreSQL (or SQLite) tables "
        "(users, products, shipment batches, lines, ledger, FxRateCache, stock). Session/engine live "
        "in db/session.py; the app does not write raw SQL for normal flows.",
        "SQLAlchemy 2 — ",
    )
    add_bullet(
        doc,
        "login tokens after Create account / Login. The React app stores the token and sends "
        "Authorization: Bearer … on API calls so only signed-in admins can cost and commit.",
        "JWT (python-jose) — ",
    )
    add_bullet(
        doc,
        "password hashing for user accounts (never store plain passwords).",
        "bcrypt / passlib — ",
    )

    add_heading(doc, "3.2 Frontend frameworks / libraries", 2)
    add_bullet(
        doc,
        "UI library for the admin screens (Welcome, Login, Dashboard, Products, Shipments, "
        "True Cost, Stock). Pages are components; state updates when you allocate, change margin, "
        "or commit — without full browser reloads.",
        "React — ",
    )
    add_bullet(
        doc,
        "build / dev tool that serves the React app in development (npm run dev, port 5173) and "
        "bundles it for production. Fast refresh while coding the UI.",
        "Vite — ",
    )
    add_bullet(
        doc,
        "client-side navigation between screens (/welcome, /products, /shipments/:id, /true-cost, …) "
        "inside the same React app.",
        "React Router — ",
    )

    add_heading(doc, "3.3 Data store (not a framework, but say it with the stack)", 2)
    add_bullet(
        doc,
        "primary relational database for the MVP (local install or Docker). Holds all business data.",
        "PostgreSQL — ",
    )
    add_bullet(
        doc,
        "optional fallback file DB when Postgres is offline so demos still run.",
        "SQLite — ",
    )
    add_para(
        doc,
        "Viva one-liner: “React + Vite for the admin UI; FastAPI + Pydantic + SQLAlchemy for the API "
        "and persistence; JWT for auth; Postgres stores the data; our Python services hold the costing rules.”",
        italic=True,
    )

    add_heading(doc, "4. Justification for the deviations (said properly)", 1)

    add_heading(doc, "4.1 Why React web instead of React Native / Expo", 2)
    add_bullet(
        doc,
        "The project aim is true landed cost, price suggestion, and batch inventory — not mobile UX.",
        "Core aim first: ",
    )
    add_bullet(
        doc,
        "admins enter shipments, allocate costs, and commit prices at a desk. A browser admin fits that workflow.",
        "User fit: ",
    )
    add_bullet(
        doc,
        "finishing FastAPI + dual cost modes + allocation + Cost history / ledger already filled the timeline. "
        "Expo would add device builds and mobile QA without proving the algorithm better.",
        "Risk / MVP: ",
    )
    add_bullet(
        doc,
        "proposal outcomes already describe a “web-based administrative dashboard.” The web React UI matches that outcome language.",
        "Outcome alignment: ",
    )
    add_bullet(
        doc,
        "React Native / Expo remains a stretch companion later; it was deferred, not abandoned as a concept.",
        "Future work: ",
    )

    add_heading(doc, "4.2 Database: PostgreSQL now, SQLite as fallback", 2)
    add_bullet(
        doc,
        "we run a real relational server locally (Windows PostgreSQL or Docker Compose) so the data layer matches the proposal’s Postgres story.",
        "As built: ",
    )
    add_bullet(
        doc,
        "SQLAlchemy + DATABASE_URL. Cloud hosts (Supabase, Neon, etc.) work by changing the URL; often add ?sslmode=require.",
        "Cloud-ready: ",
    )
    add_bullet(
        doc,
        "sqlite:///./tranzalgo.db still works if Postgres is offline — demos stay reproducible.",
        "Fallback: ",
    )
    add_bullet(
        doc,
        "deployment choice (local server vs hosted), not a wrong data model. Tables are created on API startup.",
        "Honest framing: ",
    )

    add_heading(doc, "4.3 Why FX is “on demand” not a live tick stream", 2)
    add_para(
        doc,
        "Import costing needs a trustworthy rate at decision time (when you save costs / allocate), "
        "not a continuous market ticker. Fetching when the user requests a rate, with cache and manual "
        "override, is appropriate for SME paperwork workflows and handles API downtime.",
    )

    add_heading(doc, "4.4 Why FxRateCache is a standalone entity (ERD)", 2)
    add_para(
        doc,
        "On the ERD, FxRateCache has no foreign key to ShipmentBatch. That is deliberate.",
    )
    add_bullet(
        doc,
        "Two different jobs: FxRateCache stores the last known market/API (or manual) rate for a "
        "currency pair (e.g. USD→ZMW). The shipment stores the rate that was applied to that batch’s "
        "costing (exchange_rate, exchange_rate_source, exchange_rate_at on ShipmentBatch).",
    )
    add_bullet(
        doc,
        "Reuse: one cached rate can seed many Auto FX shipments. If FX lived only inside a shipment row, "
        "every new batch would start empty and Fetch FX would be forced even when last-known-good exists.",
    )
    add_bullet(
        doc,
        "Audit / freeze: after you save costs on a shipment, that batch keeps its own rate. Updating the "
        "cache later must not silently rewrite committed or draft shipment math.",
    )
    add_bullet(
        doc,
        "Already-Local shipments never need FX — so FX should not be required as a child of every shipment.",
    )
    add_bullet(
        doc,
        "Viva one-liner: “FX cache is market memory; the shipment holds the decision rate for that import.”",
    )

    add_heading(doc, "4.5 What NOT to say", 2)
    add_bullet(doc, "“We didn’t know React Native.”")
    add_bullet(doc, "“The AI built a web app instead.”")
    add_bullet(doc, "“Supabase was too hard.” (prefer: local Postgres first; cloud URL when needed)")
    add_bullet(doc, "“The proposal was wrong.” (prefer: refined after requirements clarity)")

    add_heading(doc, "5. Likely viva questions and model answers", 1)

    add_heading(doc, "A. Problem & contribution", 2)
    add_qa(
        doc,
        "What problem does Tranz-Algo solve?",
        "Import SMEs often underprice because shipping, duty, VAT, and FX are shared across many items "
        "and hard to allocate fairly. Spreadsheets are opaque. Tranz-Algo turns shipment paperwork into "
        "per-item landed cost, suggested retail, stock by batch, and an auditable True-Cost Ledger.",
    )
    add_qa(
        doc,
        "What is your contribution vs a normal inventory or POS app?",
        "We do not replace POS or clearing agents. We focus on explainable import-batch costing under "
        "mixed paperwork (Already-Local and Auto FX), allocation comparison, price suggestion, "
        "and Cost history when a batch is committed.",
    )
    add_qa(
        doc,
        "Who is the user?",
        "A store admin / owner who imports goods in batches and needs trustworthy unit costs before setting retail.",
    )

    add_heading(doc, "B. Technology & architecture", 2)
    add_qa(
        doc,
        "Explain the frameworks you used and what each does in this project.",
        "React + Vite: admin UI screens and fast local frontend builds. React Router: move between "
        "Welcome, Products, Shipments, True Cost, Stock without full page reloads. FastAPI: REST "
        "API (/api/v1) that the UI calls. Pydantic: validates JSON bodies (shipments, costs, pricing). "
        "SQLAlchemy: maps models to PostgreSQL/SQLite tables. Uvicorn: runs the API process. "
        "JWT + bcrypt: sign-in and hashed passwords. Costing formulas live in our Python services — "
        "not inside the frameworks. See Section 3 of this document for the full list.",
    )
    add_qa(
        doc,
        "Why FastAPI?",
        "Python fits the costing math and testing; FastAPI gives a clear REST API with OpenAPI docs, "
        "validation via Pydantic, and easy JWT dependency injection — good for a three-tier academic MVP.",
    )
    add_qa(
        doc,
        "Why did you change from React Native to React web?",
        "Use the memorised sentence in Section 1. Emphasise admin workflow, MVP risk, and that the proposal "
        "outcome already mentions a web-based administrative dashboard.",
    )
    add_qa(
        doc,
        "Which database do you use?",
        "PostgreSQL for the running MVP (local server). The app reads DATABASE_URL. SQLite remains a "
        "fallback for machines without Postgres. A cloud connection string works the same way.",
    )
    add_qa(
        doc,
        "Explain your architecture.",
        "Three tiers: React frontend (screens) → FastAPI /api/v1 with JWT (HTTP) → services that do the real work "
        "(costing, shipment workflow, FX) → PostgreSQL (SQLite fallback). The diagram’s “Services” box is just "
        "the business logic — not the database and not the UI.",
    )
    add_qa(
        doc,
        "The architecture slide used to say Facade and Strategy — what does that mean in plain English?",
        "Those are design-pattern names for how the services are organised (optional to say on the slide). "
        "Facade = one shipment workflow file that runs allocate → suggest → commit so the API stays thin. "
        "Strategy = interchangeable rules for “how to split costs” (quantity/weight) and “how to get unit cost” "
        "(Already-Local vs Auto FX), instead of a long if/else. FX providers are tried in a chain until one works. "
        "Full file map: Tranz-Algo_Code_Map_and_Design_Principles.docx.",
    )
    add_qa(
        doc,
        "Which design patterns did you use?",
        "Strategy and Factory for allocation methods and line-cost modes; Chain of Responsibility for FX "
        "providers; Facade for shipment workflow; Template Method in landed-cost computation. Documented "
        "alongside Lehman’s laws and GRASP in docs/design/software_engineering_principles.md.",
    )
    add_qa(
        doc,
        "Why is FxRateCache standalone on the ERD (not linked to a shipment)?",
        "Because a market rate and a shipment’s costing rate are different things. FxRateCache is shared "
        "“last known good” for a currency pair (Fetch FX / failover / seed next Auto FX batch). Each "
        "ShipmentBatch copies or sets its own exchange_rate fields when costs are saved, so later cache "
        "updates do not rewrite that batch. Already-Local shipments skip FX entirely, so FX must not be "
        "a required child of every shipment.",
    )

    add_heading(doc, "C. Domain / formulas", 2)
    add_qa(
        doc,
        "How do you calculate landed cost?",
        "Per line: local product unit cost (Already-Local or foreign × rate) × quantity, plus allocated "
        "shipping/duty/VAT shares (by quantity, weight, or value). Unit landed = line landed ÷ quantity. "
        "Suggested retail ≈ landed × (1 + profit margin).",
    )
    add_qa(
        doc,
        "What are dual cost modes?",
        "Already-Local: paste local amounts from shipper/agent. Auto FX: foreign unit prices × exchange rate "
        "(Fetch FX). Primary mode is chosen when the shipment is created; duty/VAT still come from "
        "local clearing paperwork totals in both modes.",
    )
    add_qa(
        doc,
        "Does the system assess ZRA customs legally?",
        "No. We store and allocate duty/VAT from clearing paperwork totals on the shipment. We do not "
        "call a live customs assessment API. That is intentional scope.",
    )
    add_qa(
        doc,
        "What is the safety floor / Margin-Guard concept?",
        "Floor = landed × (1 + safety), default 10%. On True Cost, dragging margin below safety or typing "
        "a manual retail under the floor shows a warning before you save/commit. There is no post-commit "
        "recheck — after commit use Cost history. Scenario 04 covers the formula.",
    )
    add_qa(
        doc,
        "What happens on Commit?",
        "Batch locks; ledger events are written; stock increases; accepted retail is applied to products. "
        "Committed batches become read-only. Start fresh clears business data but keeps user accounts.",
    )

    add_heading(doc, "D. Evaluation & testing", 2)
    add_qa(
        doc,
        "What do you mean by a spreadsheet oracle?",
        "An oracle is an independently calculated expected answer we treat as the ground truth. "
        "For Tranz-Algo, we first work the Demo A / Demo B landed costs and suggested prices by hand "
        "(or in a spreadsheet) using the frozen formulas. Those expected numbers are the spreadsheet "
        "oracles. The app and pytest then must match them within ±0.01 ZMW. If the system disagrees "
        "with the oracle, the implementation is wrong — not the spreadsheet baseline. Oracles live in "
        "docs/scenarios/ and are locked in backend/tests/test_costing.py.",
    )
    add_qa(
        doc,
        "How did you evaluate correctness?",
        "We froze the costing formulas, built spreadsheet oracles for Demo A (Already-Local) and Demo B "
        "(Auto FX @ 20), then checked the engine with pytest (tolerance 0.01 ZMW) and replayed the "
        "same batches in the UI via CSV import. Scenario tables: docs/scenarios/. Demo handouts: "
        "Tranz-Algo_Demo_Shipment_Data.docx and How_to_Use_the_App.docx in this viva folder.",
    )
    add_qa(
        doc,
        "What are known limitations?",
        "Not a full POS; no live ZRA assessment; value allocation is supported in engine but less polished "
        "in UI compare; mobile companion not built; CSV import covers products and shipment lines "
        "(samples under docs/scenarios/samples/); one-click full demo seed is still optional.",
    )

    add_heading(doc, "E. Process & teamwork", 2)
    add_qa(
        doc,
        "Which methodology did you follow?",
        "The proposal named Waterfall for early requirements clarity on formulas. In practice we still "
        "built in increments (auth → products → shipments → True Cost → stock) after freezing formulas — "
        "so requirements were fixed first for costing, then implemented in vertical slices.",
    )
    add_qa(
        doc,
        "How did you split work with Musonda?",
        "Almost everything was decided together before coding — architecture, tech stack, dual cost modes, "
        "True Cost / Cost history, ERD, and formulas. Nixon led most of the implementation (backend, "
        "frontend wiring, costing engine, evaluation scenarios, docs). Musonda co-owned design decisions, "
        "reviewed literature drafts, and contributed a major UI / True Cost workflow commit. We rehearse "
        "the viva jointly: one narrates problem and design; the other drives the live demo.",
    )
    add_qa(
        doc,
        "If you had three more weeks, what next?",
        "Cloud-hosted Postgres if presenting off-campus, optional Expo companion, CSV invoice import, "
        "polished value-based allocation UI, scheduled FX/margin alerts, one-click demo seed.",
    )

    add_heading(doc, "5. Quick do / don’t checklist", 1)
    add_bullet(doc, "Do name the aim first, then features.")
    add_bullet(
        doc,
        "Do show Demo A (Already-Local grocery) end-to-end, then Demo B (Auto FX phone parts).",
    )
    add_bullet(doc, "Do admit out-of-scope items confidently.")
    add_bullet(doc, "Don’t claim the app replaces customs or full POS.")
    add_bullet(doc, "Don’t hide the React Native → web change; own it as prioritisation.")
    add_bullet(doc, "Don’t say “we only use SQLite” — the running MVP is PostgreSQL.")

    add_para(
        doc,
        "Document prepared for Tranz-Algo viva preparation. Align spoken answers with the running demo "
        "and the other Word files in docs/viva/ (How to Use the App + Demo Shipment Data).",
        italic=True,
        size=10,
    )

    path = OUT_DIR / "Tranz-Algo_Technology_Justification_and_Viva_QA.docx"
    doc.save(path)
    return path


def build_presentation_coach():
    doc = Document()

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = title.add_run("Tranz-Algo — How to Present the Project (Training Guide)")
    set_run_font(r, size=16, bold=True)

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = sub.add_run(
        "Final Year Project · Presentation & Demo Coaching\n"
        "Nixon Shibuchi · Musonda Katongo\n"
        "Aligned with short demos (SHP-DEMO-LOCAL-ZMW + SHP-DEMO-AUTO-FX)"
    )
    set_run_font(r, size=11, italic=True)

    add_heading(doc, "1. What this presentation must prove", 1)
    add_para(
        doc,
        "Markers care less about fancy UI and more about whether you understand the problem, "
        "the formulas, the architecture, and that the prototype works. Your talk should prove four things:",
    )
    add_bullet(doc, "You understand the true-cost / import SME problem.", "Clarity: ")
    add_bullet(doc, "You built a coherent system (not a random collection of screens).", "Design: ")
    add_bullet(doc, "The costing logic is correct and explainable.", "Correctness: ")
    add_bullet(doc, "You know the limits and next steps.", "Honesty: ")

    add_heading(doc, "2. Suggested talk structure (about 8–12 minutes)", 1)

    add_heading(doc, "Minute 0–1 · Opening", 2)
    add_para(
        doc,
        "State title, names, and one sentence aim: “Tranz-Algo helps importers recover per-item "
        "landed cost, suggest safe retail prices, and track stock by shipment batch.”",
    )

    add_heading(doc, "Minute 1–3 · Problem & gap", 2)
    add_bullet(doc, "Shared shipping/tax are hard to split fairly.")
    add_bullet(doc, "FX and mixed paperwork confuse unit cost.")
    add_bullet(doc, "Spreadsheets are opaque; POS/ERP often don’t solve this niche well for SMEs.")
    add_para(
        doc,
        "Close with: “Our gap is explainable import-batch costing under dual paperwork modes.”",
        italic=True,
    )

    add_heading(doc, "Minute 3–5 · Objectives & what we built", 2)
    add_bullet(doc, "FX-aware costing (Auto FX) + Already-Local paste mode.")
    add_bullet(doc, "Allocation by quantity/weight (engine also supports value).")
    add_bullet(doc, "Price suggestion (margin % or manual) + Cost history.")
    add_bullet(doc, "Inventory by batch + Record sale + True-Cost Ledger.")
    add_bullet(doc, "Secure admin (JWT) web dashboard on PostgreSQL.")

    add_heading(doc, "Minute 5–7 · Architecture (keep light)", 2)
    add_para(
        doc,
        "Show the three-tier diagram and say only: “Browser (React + Vite) talks to FastAPI; "
        "Pydantic validates inputs; SQLAlchemy talks to PostgreSQL; our services do costing.” "
        "If asked to explain frameworks: use Section 3 of the Technology Q&A doc. Do not lead with pattern names. "
        "If a panelist asks what Facade/Strategy mean: “Facade is the one workflow that allocates, prices, "
        "and commits; Strategy means we can swap quantity vs weight (or Already-Local vs Auto FX) without "
        "rewriting the whole app.” Details are in the Code Map viva doc. "
        "If asked about React Native in the proposal: use the justification sentence from the Q&A document. "
        "If asked about Supabase: “We run Postgres locally; DATABASE_URL can point to cloud.” "
        "If asked why FxRateCache is standalone on the ERD: “It is market memory for USD→ZMW; each "
        "shipment keeps its own applied rate so later Fetch FX does not rewrite that batch’s costing.”",
    )

    add_heading(doc, "Minute 7–11 · Live demo (most important)", 2)
    add_para(
        doc,
        "Use the handout docs/viva/Tranz-Algo_Demo_Shipment_Data.docx "
        "(and How to Use the App). Rehearse until muscle memory:",
        bold=True,
    )
    add_para(doc, "Demo A — Already-Local (landed cost)", bold=True, space_after=4)
    add_bullet(doc, "Import products_demo.csv, then shipment_A_full.csv (or Clear drafts first).")
    add_bullet(doc, "SHP-DEMO-LOCAL-ZMW → costs 5000 / 1000 / 1500.")
    add_bullet(doc, "True Cost: quantity → margin 0.30 → commit. Landed e.g. 170 / 107 / 160 / 120 / 93.")
    add_para(doc, "Demo B — Auto FX (Fetch FX)", bold=True, space_after=4)
    add_bullet(doc, "Import shipment_B_full.csv.")
    add_bullet(doc, "SHP-DEMO-AUTO-FX → rate 20 (CSV / starter) → costs 2800 / 700 / 1050.")
    add_bullet(doc, "True Cost: weight → margin 0.25 → commit. @20 → 136.25 / 145 / 46.25 / 92.50.")

    add_heading(doc, "Minute 11–12 · Evaluation, limits, close", 2)
    add_bullet(doc, "pytest / spreadsheet oracle within 0.01 ZMW.")
    add_bullet(doc, "Limits: not full POS; no legal customs assessment API; mobile stretch deferred.")
    add_bullet(doc, "Close: restate contribution in one line, thank supervisor/panel, invite questions.")

    add_heading(doc, "3. What is important to state (must-say lines)", 1)
    add_bullet(
        doc,
        "True cost = product + allocated shipping + duty + VAT (and FX when needed).",
        "Definition: ",
    )
    add_bullet(
        doc,
        "We allocate shared charges; we do not legally assess customs.",
        "Taxes: ",
    )
    add_bullet(
        doc,
        "Dual modes exist because real paperwork is often mixed.",
        "Dual modes: ",
    )
    add_bullet(
        doc,
        "Commit locks the batch and writes an auditable ledger.",
        "Commit: ",
    )
    add_bullet(
        doc,
        "Web admin prioritises desk workflow; FastAPI/JWT/costing stayed as proposed; DB is PostgreSQL.",
        "Stack: ",
    )
    add_bullet(
        doc,
        "Out of scope: shipping logistics operations and payment gateways.",
        "Scope: ",
    )

    add_heading(doc, "4. Slide outline (if you use PPT)", 1)
    add_para(
        doc,
        "Prefer Presentation_Template_2026.pptx for the official layout. Keep slides sparse; demo over reading.",
    )
    for i, slide in enumerate(
        [
            "Title + names + supervisor",
            "Problem (3 bullets max)",
            "Aim & objectives",
            "System overview diagram (React → FastAPI → PostgreSQL)",
            "Dual cost modes",
            "Landed cost + suggestion formulas",
            "Demo A / Demo B (or “Live demo” slide)",
            "Evaluation results",
            "Limitations & future work",
            "Thank you / questions",
        ],
        start=1,
    ):
        add_bullet(doc, slide, f"Slide {i}: ")

    add_heading(doc, "5. Demo readiness checklist", 1)
    add_bullet(doc, "PostgreSQL running; backend :8000 and frontend :5173 tested the morning of.")
    add_bullet(doc, "Known working account (or create account live once).")
    add_bullet(doc, "Demo Word handout printed or open on a second screen.")
    add_bullet(doc, "Browser zoom readable on projector; Day theme for visibility.")
    add_bullet(doc, "Backup: screenshots or short screen recording if Wi‑Fi/API fails.")
    add_bullet(doc, "Demo A works fully offline; Demo B keeps rate 20 if Fetch FX fails or is skipped.")

    add_heading(doc, "6. How to speak (delivery coaching)", 1)
    add_bullet(doc, "Open with the problem, not the tech stack.")
    add_bullet(doc, "Point at the screen; say what the user is doing in each click.")
    add_bullet(doc, "When a formula appears, pause and explain one number.")
    add_bullet(doc, "If something breaks: narrate recovery (“I’ll use the saved batch…”) — don’t go silent.")
    add_bullet(doc, "Share time: one person narrates problem/architecture; the other drives the demo (agree roles).")
    add_bullet(doc, "After each panel question: answer in 2–4 sentences, then stop. Don’t ramble.")

    add_heading(doc, "7. Roles for Nixon & Musonda (agreed split)", 1)
    add_para(
        doc,
        "Design and technology choices were joint discussions before implementation. Coding was mostly Nixon; "
        "Musonda co-owned design and shipped a UI / True Cost workflow update. Full detail: "
        "Tranz-Algo_Contribution_Split.docx.",
        italic=True,
    )
    add_bullet(
        doc,
        "problem & gap, formulas, costing engine, API, evaluation scenarios, most commits, tech justification.",
        "Nixon (viva speak): ",
    )
    add_bullet(
        doc,
        "joint design decisions, literature review, UI / True Cost workflow contribution, live demo drive.",
        "Musonda (viva speak): ",
    )
    add_bullet(
        doc,
        "architecture narrative, dual modes rationale, Postgres vs SQLite story, what we would do next.",
        "Both: ",
    )

    add_heading(doc, "8. Rehearsal plan (3 runs)", 1)
    add_bullet(doc, "Run 1 — full talk + Demo A + short Demo B, note every stumble.")
    add_bullet(doc, "Run 2 — Demo A only under time pressure (5 minutes).")
    add_bullet(doc, "Run 3 — cold start with panel-style interruptions (tech change Q, ZRA Q, POS Q, DB Q).")

    add_heading(doc, "9. Emergency answers (10 seconds)", 1)
    add_qa(
        doc,
        "Is this a POS?",
        "No. Record sale only reduces stock so inventory stays consistent. Full checkout is out of scope.",
    )
    add_qa(
        doc,
        "Can it replace clearing agents?",
        "No. We consume their paperwork totals; we don’t assess duty legally.",
    )
    add_qa(
        doc,
        "Why not mobile as proposed?",
        "Admin desk workflow + MVP focus on costing correctness; web dashboard delivers the stated outcomes.",
    )
    add_qa(
        doc,
        "Is the database still SQLite?",
        "No — the running MVP uses PostgreSQL. SQLite is only the offline fallback.",
    )
    add_qa(
        doc,
        "What is a spreadsheet oracle?",
        "An independent expected answer from the frozen formulas (worked by hand/spreadsheet). "
        "The app must match it within ±0.01 ZMW — the oracle is the ground truth.",
    )

    add_para(
        doc,
        "Train with this guide beside the Technology Justification & Viva Q&A document. "
        "Your confidence comes from a rehearsed demo and clear definitions — not from memorising every line of code.",
        italic=True,
        size=10,
    )

    path = OUT_DIR / "Tranz-Algo_Presentation_Training_Guide.docx"
    doc.save(path)
    return path


def add_table(doc, headers, rows):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = "Table Grid"
    for i, h in enumerate(headers):
        table.rows[0].cells[i].text = h
        for p in table.rows[0].cells[i].paragraphs:
            for run in p.runs:
                run.bold = True
    for r_idx, row in enumerate(rows):
        for c_idx, val in enumerate(row):
            table.rows[r_idx + 1].cells[c_idx].text = str(val)
    doc.add_paragraph("")


def build_how_to_use_app():
    doc = Document()

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = title.add_run("Tranz-Algo — How to Use the App")
    set_run_font(r, size=16, bold=True)

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = sub.add_run(
        "Operator guide for the as-built MVP\n"
        "Nixon Shibuchi · Musonda Katongo\n"
        "App http://127.0.0.1:5173 · API http://127.0.0.1:8000"
    )
    set_run_font(r, size=11, italic=True)

    add_para(
        doc,
        "This is the practical how-to for using Tranz-Algo and running the viva demos. "
        "Keep it beside Demo Shipment Data.docx. Design/literature detail lives under docs/design "
        "and docs/literature — not here.",
        italic=True,
    )

    add_heading(doc, "1. Start the app", 1)
    add_bullet(doc, "Backend: cd backend → activate .venv → uvicorn app.main:app --reload --port 8000")
    add_bullet(doc, "Frontend: cd frontend → npm run dev (http://127.0.0.1:5173)")
    add_bullet(doc, "PostgreSQL via DATABASE_URL in backend/.env (Supabase pooler or local). SQLite fallback if needed.")
    add_bullet(doc, "First visit: Welcome → Get started / Sign in → Create account (no shared password).")

    add_heading(doc, "2. What each screen is for", 1)
    add_table(
        doc,
        ["Screen", "What you do"],
        [
            ["Welcome", "First-visit intro (once). True cost, dual modes, retail suggestion, cost history."],
            ["True Cost", "Allocate shipping/duty/VAT, set margin, suggest or enter retail, commit."],
            ["Dashboard", "Stock / shipment overview. Start fresh (type RESET) clears business data."],
            ["Products", "Catalogue. Optional CSV import (products_demo.csv)."],
            ["Shipments", "Create/open batches, Clear drafts, import full shipment CSV."],
            ["Shipment detail", "Lines + costs. Fetch FX only for Auto FX. After commit: Cost history."],
            ["Stock", "Available / low / out. Record sale reduces stock (not a POS)."],
        ],
    )

    add_heading(doc, "3. Day-to-day workflow", 1)
    add_bullet(doc, "Add products (SKU + name; set default weight if using weight allocation).")
    add_bullet(doc, "Create a shipment and choose mode once: Already-Local or Auto FX.")
    add_bullet(doc, "On shipment detail: add lines; save costs (shipping, duty, VAT from paperwork).")
    add_bullet(doc, "Open True Cost → allocate (quantity or weight) → set profit margin → suggest or manual prices.")
    add_bullet(doc, "Safety floor: floor = landed × (1 + 10%). Dragging margin below 10% or typing retail under floor shows a warning. No post-commit recheck.")
    add_bullet(doc, "Commit → Cost history written, stock rises, retail applied.")
    add_bullet(doc, "Stock → Record sale when units leave the shelf.")

    add_heading(doc, "4. Cost modes & taxes (say this in viva)", 1)
    add_bullet(doc, "Already-Local: paste local product units from shipper/agent paperwork.")
    add_bullet(doc, "Auto FX: foreign unit prices × rate (starter / CSV 20; optional Fetch FX).")
    add_bullet(doc, "Duty/VAT = clearing paperwork totals on the shipment — we allocate them; we do not assess ZRA legally.")
    add_bullet(doc, "Status: draft → costed (after allocate) → committed (locked).")

    add_heading(doc, "5. Viva demo path (CSV — fastest)", 1)
    add_para(doc, "Numbers and tables: Tranz-Algo_Demo_Shipment_Data.docx in this folder.", italic=True)
    add_bullet(doc, "Products → Import CSV → docs/scenarios/samples/products_demo.csv")
    add_bullet(
        doc,
        "Shipments → Clear drafts if re-importing → Import shipment_A_full.csv "
        "(SHP-DEMO-LOCAL-ZMW) → True Cost → quantity → margin 0.30 → commit.",
        "Demo A: ",
    )
    add_bullet(doc, "Expected landed ≈ 170 / 107 / 160 / 120 / 93")
    add_bullet(
        doc,
        "Import shipment_B_full.csv (SHP-DEMO-AUTO-FX). Keep rate 20 (CSV / UI starter). "
        "True Cost → weight → margin 0.25 → commit.",
        "Demo B: ",
    )
    add_bullet(doc, "Expected landed @20 ≈ 136.25 / 145 / 46.25 / 92.50")
    add_bullet(doc, "Open a committed shipment → Cost history (When / What).")

    add_heading(doc, "6. Useful buttons", 1)
    add_bullet(doc, "Clear drafts — removes non-committed shipments so you can re-import demos.")
    add_bullet(doc, "Start fresh (Dashboard) — clears products/shipments/ledger; keeps your login. Type RESET.")
    add_bullet(doc, "Fetch FX — only on Auto FX shipment costs.")

    add_heading(doc, "7. Related viva documents in this folder", 1)
    add_bullet(doc, "Tranz-Algo_Demo_Shipment_Data.docx — printable demo numbers.")
    add_bullet(doc, "Tranz-Algo_Presentation_Training_Guide.docx — talk + demo script.")
    add_bullet(doc, "Tranz-Algo_Technology_Justification_and_Viva_QA.docx — stack deltas + panel Q&A.")

    add_para(
        doc,
        "Regenerate all viva Word files: python docs/viva/build_viva_docs.py (from repo with backend venv).",
        italic=True,
        size=10,
    )

    path = OUT_DIR / "Tranz-Algo_How_to_Use_the_App.docx"
    doc.save(path)
    return path


def build_demo_handout():
    doc = Document()
    title = doc.add_heading("Tranz-Algo — Demo Shipment Data", level=0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph(
        "Two short demos for viva. Full how-to: Tranz-Algo_How_to_Use_the_App.docx in docs/viva/. "
        "CSV samples: docs/scenarios/samples/."
    )

    doc.add_heading("Demo A — Already-Local (groceries)", level=1)
    doc.add_paragraph(
        "Road goods from SA. Agent paperwork already in ZMW. Show allocate → landed → suggest → commit."
    )
    doc.add_heading("Products", level=2)
    add_table(
        doc,
        ["SKU", "Name", "Weight (kg)"],
        [
            ["RICE-5", "Rice 5 kg", "5"],
            ["SUGAR-1", "Sugar 1 kg", "1"],
            ["OIL-2L", "Cooking oil 2 L", "2"],
            ["TEA-500", "Black tea 500 g", "0.5"],
            ["SOAP-BAR", "Bath soap bar", "0.12"],
        ],
    )
    doc.add_heading("Shipment", level=2)
    add_table(
        doc,
        ["Field", "Value"],
        [
            ["Reference", "SHP-DEMO-LOCAL-ZMW"],
            ["Supplier", "SA Wholesale (Johannesburg)"],
            ["Mode", "Already-Local (set on create)"],
        ],
    )
    doc.add_heading("Lines", level=2)
    add_table(
        doc,
        ["Product", "Qty", "Local unit (ZMW)"],
        [
            ["RICE-5", "20", "95"],
            ["SUGAR-1", "30", "32"],
            ["OIL-2L", "10", "85"],
            ["TEA-500", "24", "45"],
            ["SOAP-BAR", "16", "18"],
        ],
    )
    doc.add_heading("Costs", level=2)
    add_table(
        doc,
        ["Field", "Value"],
        [
            ["Shipping", "5000"],
            ["Duty", "1000"],
            ["VAT", "1500"],
            ["Paperwork", "Agent invoice AG-100 / road pack RC-441"],
        ],
    )
    doc.add_heading("True Cost", level=2)
    add_table(
        doc,
        ["Setting", "Value"],
        [["Allocation", "quantity (100 units)"], ["Margin", "0.30"]],
    )
    doc.add_heading("Expected (check)", level=2)
    doc.add_paragraph("Shares per unit: ship 50 + duty 10 + VAT 15 = 75")
    add_table(
        doc,
        ["SKU", "Landed unit", "Suggested ×1.30"],
        [
            ["RICE-5", "170.00", "221.00"],
            ["SUGAR-1", "107.00", "139.10"],
            ["OIL-2L", "160.00", "208.00"],
            ["TEA-500", "120.00", "156.00"],
            ["SOAP-BAR", "93.00", "120.90"],
        ],
    )

    doc.add_heading("Demo B — Auto FX (phone parts)", level=1)
    doc.add_paragraph(
        "USD invoice from China. Rate starts at 20 (or last fetched). Click Fetch FX for live, "
        "keep rate 20 for the oracle numbers below. Then allocate by weight → commit."
    )
    doc.add_heading("Products", level=2)
    add_table(
        doc,
        ["SKU", "Name", "Weight (kg)"],
        [
            ["EARBUD", "Wireless earbuds", "0.05"],
            ["CHARGER", "Phone charger", "0.20"],
            ["CABLE", "USB-C cable", "0.05"],
            ["CASE-SOFT", "Phone soft case", "0.08"],
        ],
    )
    doc.add_heading("Shipment", level=2)
    add_table(
        doc,
        ["Field", "Value"],
        [
            ["Reference", "SHP-DEMO-AUTO-FX"],
            ["Supplier", "Shenzhen Parts Co"],
            ["Mode", "Auto FX (set on create)"],
            ["Foreign currency", "USD"],
        ],
    )
    doc.add_heading("Lines", level=2)
    add_table(
        doc,
        ["Product", "Qty", "Line weight (kg)", "USD unit"],
        [
            ["EARBUD", "40", "2.0", "6.00"],
            ["CHARGER", "30", "6.0", "4.00"],
            ["CABLE", "40", "2.0", "1.50"],
            ["CASE-SOFT", "40", "4.0", "3.00"],
        ],
    )
    doc.add_paragraph("Total line weight = 14 kg")
    doc.add_heading("Costs", level=2)
    add_table(
        doc,
        ["Field", "Value"],
        [
            ["Exchange rate", "20 (CSV / UI starter = demo oracle)"],
            ["Shipping", "2800"],
            ["Duty", "700"],
            ["VAT", "1050"],
            ["Paperwork", "CI-220 / clearance CL-55"],
        ],
    )
    doc.add_heading("True Cost", level=2)
    add_table(
        doc,
        ["Setting", "Value"],
        [["Allocation", "weight (14 kg)"], ["Margin", "0.25"]],
    )
    doc.add_heading("Expected at rate = 20", level=2)
    doc.add_paragraph("Local unit = foreign × 20. Shares per kg: ship 200 + duty 50 + VAT 75 = 325")
    add_table(
        doc,
        ["SKU", "Local unit", "Landed unit", "Suggested ×1.25"],
        [
            ["EARBUD", "120.00", "136.25", "170.31"],
            ["CHARGER", "80.00", "145.00", "181.25"],
            ["CABLE", "30.00", "46.25", "57.81"],
            ["CASE-SOFT", "60.00", "92.50", "115.63"],
        ],
    )

    doc.add_heading("Order of work", level=1)
    doc.add_paragraph("1. Products → Import CSV (docs/scenarios/samples/products_demo.csv).")
    doc.add_paragraph(
        "2. Shipments → Clear drafts if needed → Import shipment_A_full.csv → True Cost → quantity → commit."
    )
    doc.add_paragraph(
        "3. Shipments → Import shipment_B_full.csv → keep rate 20 → True Cost → weight → commit."
    )
    doc.add_paragraph("4. Open a committed shipment → Cost history (When / What).")

    p = doc.add_paragraph(
        "Also see: Tranz-Algo_How_to_Use_the_App.docx and Tranz-Algo_Presentation_Training_Guide.docx in docs/viva/."
    )
    p.runs[0].font.size = Pt(10)

    path = OUT_DIR / "Tranz-Algo_Demo_Shipment_Data.docx"
    doc.save(path)
    return path


def build_contribution_split():
    doc = Document()

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = title.add_run("Tranz-Algo — Contribution Split")
    set_run_font(r, size=16, bold=True)

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = sub.add_run(
        "How Nixon Shibuchi (2021437361) and Musonda Katongo (2020583969) divided the work\n"
        "Final Year Project · University of Zambia · Computing and Informatics"
    )
    set_run_font(r, size=11, italic=True)

    add_heading(doc, "1. One-sentence summary", 1)
    add_para(
        doc,
        "We designed almost everything together before writing code; Nixon led most of the implementation; "
        "Musonda co-owned architecture and design decisions, reviewed literature, and contributed a major "
        "UI / True Cost workflow update.",
    )

    add_heading(doc, "2. How we worked (process)", 1)
    add_bullet(
        doc,
        "Discuss first, then build. Architecture, technology choices, dual cost modes (Auto FX / Already-Local), "
        "True Cost Ledger, Cost history, Allocation Comparator, ERD, and formulas were agreed in joint design "
        "sessions before coding started.",
    )
    add_bullet(
        doc,
        "Incremental delivery after the costing rules were frozen: auth → products → shipments → True Cost → stock.",
    )
    add_bullet(
        doc,
        "Literature and design docs list joint ownership or lead + reviewer where that matches what we did.",
    )

    add_heading(doc, "3. Shared ownership (both)", 1)
    add_para(doc, "These are joint contributions — discussed and decided together:")
    add_bullet(doc, "Problem definition and academic gap (import-batch costing vs spreadsheet practice).")
    add_bullet(doc, "System architecture (FastAPI + React + PostgreSQL, SQLite fallback for local/dev).")
    add_bullet(doc, "Technology selection and justified changes (e.g. React Native companion deferred; web-first MVP).")
    add_bullet(doc, "Data model / ERD and screen wireframe direction.")
    add_bullet(doc, "Costing rules: dual modes, allocation methods, duty/VAT from paperwork, safety floor idea.")
    add_bullet(doc, "Evaluation approach (Demo A Already-Local grocery; Demo B Auto FX phone parts).")
    add_bullet(doc, "Viva narrative: who speaks problem/design vs who drives the live demo (rehearsed together).")

    add_heading(doc, "4. Nixon Shibuchi — primary implementation", 1)
    add_para(
        doc,
        "Most of the working codebase and documentation updates, including ongoing/pending work, "
        "were implemented by Nixon:",
    )
    add_bullet(doc, "Backend: FastAPI app structure, auth, products, shipments, FX cache, True Cost / Cost history APIs.")
    add_bullet(doc, "Costing engine and dual-mode logic (Auto FX vs Already-Local), allocation, safety floor behaviour.")
    add_bullet(doc, "Frontend wiring of core flows (login/create account, shipments, True Cost, inventory paths).")
    add_bullet(doc, "Evaluation scenarios, CSV demo samples, oracles, and most design/literature drafting as lead author.")
    add_bullet(doc, "Viva Word pack and how-to / demo data documents.")
    add_bullet(doc, "Majority of git commits under Nixon Shibuchi (including work still pending commit at report time).")

    add_heading(doc, "5. Musonda Katongo — co-design & targeted implementation", 1)
    add_para(doc, "Musonda’s contribution is not “secondary thinking” — design ownership was joint. In addition:")
    add_bullet(
        doc,
        "Joint design partner for architecture, UI direction, and technology decisions before and during build.",
    )
    add_bullet(
        doc,
        "Reviewer on literature drafts (related work, gap statement, sources).",
    )
    add_bullet(
        doc,
        "Implementation contribution pushed under Musonda Katongo’s account: UI redesign and True Cost workflow updates "
        "(commit on the shared repository).",
    )
    add_bullet(
        doc,
        "Viva role: drive the live demo (screen walkthrough) while Nixon covers problem, formulas, and evaluation "
        "— or swap if preferred; agree once and stick to it.",
    )

    add_heading(doc, "6. Suggested report / declaration wording", 1)
    add_para(
        doc,
        "You can paste or adapt this into the project report contribution / declaration section:",
        italic=True,
    )
    add_para(
        doc,
        "“Tranz-Algo was developed jointly by Nixon Shibuchi and Musonda Katongo. Requirements, architecture, "
        "technology choices, data design, and costing rules were decided collaboratively before implementation. "
        "Nixon led the majority of software implementation (backend, costing engine, frontend integration, "
        "evaluation artefacts, and documentation). Musonda co-owned the design process, reviewed literature "
        "outputs, and contributed UI and True Cost workflow implementation. Both members share ownership of "
        "the system design and can explain the full solution in the viva.”",
    )

    add_heading(doc, "7. Suggested viva speaking split", 1)
    add_bullet(doc, "Problem, gap, formulas, evaluation numbers, stack change justification.", "Nixon: ")
    add_bullet(doc, "Live demo (create shipment → True Cost → commit → Cost history → stock).", "Musonda: ")
    add_bullet(doc, "Architecture overview, dual modes “why”, Postgres story, limitations / next steps.", "Either: ")

    add_heading(doc, "8. Honesty note for the panel", 1)
    add_para(
        doc,
        "If asked “who wrote the code?”, answer plainly: most implementation is Nixon’s; design was joint; "
        "Musonda also shipped UI / True Cost workflow code. Do not invent equal line-count if that is not true — "
        "examiners care more that both understand the system and that the split is credible.",
    )

    path = OUT_DIR / "Tranz-Algo_Contribution_Split.docx"
    doc.save(path)
    # Also keep a copy under literature for the report chapter pack
    lit_path = OUT_DIR.parent / "literature" / "Tranz-Algo_Contribution_Split.docx"
    doc.save(lit_path)
    return path


def build_code_map_and_principles():
    """Brief map: where main features live + how design patterns appear in code."""
    doc = Document()

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = title.add_run("Tranz-Algo — Code Map & Design Principles in Code")
    set_run_font(r, size=16, bold=True)

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = sub.add_run(
        "Brief viva sheet · where the important code is · how patterns show up\n"
        "Nixon Shibuchi · Musonda Katongo · University of Zambia"
    )
    set_run_font(r, size=11, italic=True)

    add_para(
        doc,
        "One sentence: routers handle HTTP; services hold business rules; React pages call the API. "
        "Do not claim you memorised every file — point to the layer and the pattern.",
        italic=True,
        size=10,
    )

    add_heading(doc, "1. Frameworks → role in Tranz-Algo", 1)
    add_table(
        doc,
        ["Piece", "What it is", "What it does here"],
        [
            ["React + Vite", "UI library + frontend build tool", "Admin screens; Vite serves/builds the React app"],
            ["React Router", "In-app navigation", "Routes between Welcome, Products, Shipments, True Cost, Stock"],
            ["FastAPI", "Python REST framework", "/api/v1 endpoints; thin routers → services"],
            ["Uvicorn", "API process / ASGI server", "Runs FastAPI so the browser can call it"],
            ["Pydantic", "Schema / validation", "Checks JSON bodies (shipments, costs, pricing)"],
            ["SQLAlchemy 2", "ORM", "Python models ↔ PostgreSQL/SQLite tables"],
            ["JWT + bcrypt", "Auth helpers", "Login tokens; hashed passwords"],
            ["PostgreSQL", "Primary database", "Persists users, products, shipments, ledger, FX cache"],
        ],
    )
    add_para(
        doc,
        "Costing rules are our code (services/costing.py, strategies/), not “inside” React or FastAPI.",
        italic=True,
        size=10,
    )

    add_heading(doc, "2. Layer layout (whole system)", 1)
    add_table(
        doc,
        ["Layer", "Folder", "Job"],
        [
            ["UI", "frontend/src/pages/", "Screens (True Cost, Shipments, Products, Stock…)"],
            ["UI shared", "frontend/src/costModes.js, api.js, csvImport.js", "Mode labels, HTTP client, CSV helpers"],
            ["HTTP API", "backend/app/api/v1/", "Thin endpoints: auth, products, shipments, FX, inventory"],
            ["Workflow", "backend/app/services/shipment_workflow.py", "Allocate → suggest → commit (Facade)"],
            ["Formulas", "backend/app/services/costing.py", "Landed-cost Template Method over Strategies"],
            ["Strategies", "backend/app/services/strategies/", "Allocation, line-cost modes, FX providers"],
            ["Data", "backend/app/models/", "SQLAlchemy entities (batch, items, ledger, sales…)"],
            ["Config / DB", "backend/app/core/, db/session.py", "Settings, JWT, engine / pool"],
        ],
    )

    add_heading(doc, "3. Main functionalities → files", 1)
    add_table(
        doc,
        ["Feature", "Backend", "Frontend"],
        [
            ["Login / Create account", "api/v1/auth.py, core/security.py", "pages/LoginPage.jsx, auth.jsx"],
            ["Products + CSV", "api/v1/products.py", "pages/ProductsPage.jsx, csvImport.js"],
            ["Create shipment / dual mode", "api/v1/shipments.py", "pages/ShipmentsPage.jsx, costModes.js"],
            ["Lines, costs, Fetch FX", "shipments.py, services/fx.py", "pages/ShipmentDetailPage.jsx"],
            ["Allocate / suggest / commit", "shipment_workflow.py + costing.py", "pages/TrueCostPage.jsx"],
            ["Cost history (ledger)", "shipments ledger endpoints + models", "ShipmentDetailPage + ledgerFormat.js"],
            ["Stock + Record sale", "api/v1/inventory.py", "pages/InventoryPage.jsx"],
            ["Start fresh (reset)", "api/v1/admin.py", "pages/DashboardPage.jsx"],
            ["Safety floor (Landed×1.1)", "shipment_workflow / suggest-prices", "TrueCostPage.jsx (live adjust)"],
        ],
    )
    add_para(
        doc,
        "Demo CSV samples: docs/scenarios/samples/. Import path hits the Products / Shipments pages above.",
        size=10,
    )

    add_heading(doc, "4. Design principles / patterns — in code", 1)
    add_para(
        doc,
        "On the architecture diagram, the Services box is labelled in plain words (costing, workflow, FX). "
        "Pattern names below are for viva answers — not required on the slide.",
        size=10,
    )
    add_para(
        doc,
        "Plain English first: Facade = one door for “run the shipment costing steps.” "
        "Strategy = plug-in rules for “how to allocate” and “how to price a line.” "
        "Then give the file path if asked.",
        size=10,
        italic=True,
    )

    add_heading(doc, "4.1 GoF patterns", 2)
    add_table(
        doc,
        ["Pattern", "Where", "What it does here"],
        [
            [
                "Facade",
                "services/shipment_workflow.py",
                "One place for allocate, suggest prices, commit — routers stay thin",
            ],
            [
                "Strategy",
                "strategies/allocation.py, line_cost.py",
                "Swap quantity/weight/value or Already-Local/Auto FX without rewriting callers",
            ],
            [
                "Simple Factory",
                "get_allocation_strategy(), get_line_cost_strategy()",
                "Pick the Strategy from a string (method / mode name)",
            ],
            [
                "Template Method",
                "costing.compute_landed_for_method()",
                "Fixed steps (basis → shares → assemble); Strategies fill the varying bits",
            ],
            [
                "Chain of Responsibility",
                "strategies/fx_providers.py (+ fx.py)",
                "Try Identity → Frankfurter → open.er-api until a rate works",
            ],
        ],
    )

    add_heading(doc, "4.2 Layering & GRASP (short)", 2)
    add_bullet(doc, "Controller: FastAPI routers accept HTTP and delegate — they do not own the formulas.")
    add_bullet(doc, "Information Expert: costing / Strategies own the math; models own persisted fields.")
    add_bullet(doc, "Low Coupling: React talks only via api.js → REST; costing.py does not import FastAPI.")
    add_bullet(doc, "Protected Variations: new allocation method or FX source registers in strategies/, not in every page.")
    add_bullet(
        doc,
        "Separation of concerns: UI (React) · API (routers) · domain (services) · data (models/DB).",
    )

    add_heading(doc, "5. One-line viva answers", 1)
    add_qa(
        doc,
        "What do React, FastAPI, and SQLAlchemy each do here?",
        "React = screens; FastAPI = REST API the screens call; SQLAlchemy = tables for products/shipments/ledger. "
        "Costing math is in services/, not inside those frameworks.",
    )
    add_qa(
        doc,
        "Where is landed cost calculated?",
        "backend/app/services/costing.py, using Strategies under services/strategies/; True Cost UI is TrueCostPage.jsx.",
    )
    add_qa(
        doc,
        "Where is the Facade?",
        "shipment_workflow.py — allocate, suggest, and commit go through it so api/v1/shipments.py stays thin.",
    )
    add_qa(
        doc,
        "How did you apply Strategy?",
        "Allocation (quantity/weight/value) and line cost (Already-Local / Auto FX) are interchangeable Strategy classes selected by name.",
    )
    add_qa(
        doc,
        "How does Fetch FX fail over?",
        "Chain of Responsibility in fx_providers.py: try providers in order; then cache / manual override.",
    )
    add_qa(
        doc,
        "Why is FxRateCache not a child of ShipmentBatch?",
        "Standalone market memory (reusable last-known rate). The shipment stores its own applied rate so "
        "costing stays frozen per batch; Already-Local does not need FX at all.",
    )

    add_para(
        doc,
        "Fuller write-up: docs/design/software_engineering_principles.md and docs/design/architecture.md.",
        italic=True,
        size=10,
    )

    path = OUT_DIR / "Tranz-Algo_Code_Map_and_Design_Principles.docx"
    doc.save(path)
    return path


if __name__ == "__main__":
    for builder in (
        build_how_to_use_app,
        build_demo_handout,
        build_tech_and_qa,
        build_presentation_coach,
        build_contribution_split,
        build_code_map_and_principles,
    ):
        print(builder())
