"""Draw presentation-ready diagrams for the Tranz-Algo report and slides."""

from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle
from matplotlib.patches import Circle


FIG_DIR = Path(__file__).resolve().parent / "figures"
FIG_DIR.mkdir(parents=True, exist_ok=True)

NAVY = "#102A38"
TEAL = "#1F5A68"
ACCENT = "#A8481A"
LIGHT = "#F4F7F8"
LINE = "#1A2330"
WHITE = "#FFFFFF"
PRINT_DPI = 240


def _box(ax, x, y, w, h, text, fc=TEAL, ec=NAVY, fontsize=10, bold=True):
    patch = FancyBboxPatch(
        (x, y),
        w,
        h,
        boxstyle="round,pad=0.02,rounding_size=0.08",
        linewidth=1.8,
        edgecolor=ec,
        facecolor=fc,
    )
    ax.add_patch(patch)
    ax.text(
        x + w / 2,
        y + h / 2,
        text,
        ha="center",
        va="center",
        fontsize=fontsize,
        color=WHITE if fc != LIGHT else NAVY,
        fontweight="bold" if bold else "normal",
        wrap=True,
    )
    return patch


def _arrow(ax, x1, y1, x2, y2):
    ax.add_patch(
        FancyArrowPatch(
            (x1, y1),
            (x2, y2),
            arrowstyle="-|>",
            mutation_scale=14,
            linewidth=1.6,
            color=LINE,
        )
    )


def draw_architecture():
    fig, ax = plt.subplots(figsize=(10, 6.2))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6.5)
    ax.axis("off")
    ax.set_title("Figure: Tranz-Algo three-tier architecture", fontsize=15, color=NAVY, pad=12, fontweight="bold")

    # Presentation
    ax.add_patch(Rectangle((0.4, 4.6), 9.2, 1.5, fill=False, linestyle="--", edgecolor=TEAL, linewidth=1.6))
    ax.text(0.55, 5.85, "Presentation tier", fontsize=10, color=TEAL, fontweight="bold")
    _box(ax, 2.8, 4.85, 4.4, 0.95, "React SPA (Vite)\nAuth · Products · Shipments\nTrue Cost · Stock · Dashboard", fc=NAVY, fontsize=10)

    # Application
    ax.add_patch(Rectangle((0.4, 2.35), 9.2, 1.85, fill=False, linestyle="--", edgecolor=TEAL, linewidth=1.6))
    ax.text(0.55, 3.95, "Application tier", fontsize=10, color=TEAL, fontweight="bold")
    _box(ax, 0.7, 2.6, 3.6, 1.1, "FastAPI  /api/v1\nJWT routers", fc=TEAL, fontsize=10.5)
    _box(ax, 5.0, 2.6, 4.2, 1.1, "Services\nFacade · Strategy · FX chain", fc=TEAL, fontsize=10.5)
    _arrow(ax, 4.35, 3.15, 5.0, 3.15)

    # Data
    ax.add_patch(Rectangle((0.4, 0.25), 9.2, 1.75, fill=False, linestyle="--", edgecolor=TEAL, linewidth=1.6))
    ax.text(0.55, 1.75, "Data tier", fontsize=10, color=TEAL, fontweight="bold")
    _box(ax, 1.0, 0.5, 4.0, 1.05, "PostgreSQL (primary)\nSQLite fallback", fc=ACCENT, fontsize=10.5)
    _box(ax, 5.8, 0.5, 3.4, 1.05, "Frankfurter /\nopen.er-api (FX)", fc="#3D5A66", fontsize=10.5)

    _arrow(ax, 5.0, 4.85, 5.0, 3.75)
    ax.text(5.15, 4.25, "HTTP JSON + JWT", fontsize=9, color=LINE, fontweight="bold")
    _arrow(ax, 2.5, 2.6, 2.5, 1.55)
    _arrow(ax, 7.0, 2.6, 7.3, 1.55)
    ax.text(7.4, 2.05, "optional", fontsize=9, color=LINE, style="italic")

    fig.tight_layout()
    path = FIG_DIR / "architecture.png"
    fig.savefig(path, dpi=PRINT_DPI, bbox_inches="tight", facecolor=WHITE)
    plt.close(fig)
    return path


def _uml_class(ax, x, y, w, name, attrs, stereotype="entity"):
    """Draw a UML-style class/entity box with name + attribute compartments."""
    header_h = 0.48
    line_h = 0.26
    body_h = max(0.6, 0.14 + line_h * len(attrs))
    h = header_h + body_h

    # Outer rectangle
    ax.add_patch(
        Rectangle((x, y), w, h, linewidth=1.8, edgecolor=NAVY, facecolor=WHITE, zorder=3)
    )
    # Header fill
    ax.add_patch(
        Rectangle((x, y + body_h), w, header_h, linewidth=0, facecolor="#DDE6EB", zorder=3)
    )
    # Divider
    ax.plot([x, x + w], [y + body_h, y + body_h], color=NAVY, linewidth=1.4, zorder=4)

    ax.text(
        x + w / 2,
        y + body_h + header_h * 0.72,
        f"«{stereotype}»",
        ha="center",
        va="center",
        fontsize=8,
        color=TEAL,
        style="italic",
        zorder=5,
    )
    ax.text(
        x + w / 2,
        y + body_h + header_h * 0.28,
        name,
        ha="center",
        va="center",
        fontsize=11,
        fontweight="bold",
        color=NAVY,
        zorder=5,
    )

    for i, attr in enumerate(attrs):
        ax.text(
            x + 0.08,
            y + body_h - 0.16 - i * line_h,
            attr,
            ha="left",
            va="top",
            fontsize=8.5,
            color=LINE,
            family="monospace",
            zorder=5,
        )
    return {"x": x, "y": y, "w": w, "h": h, "cx": x + w / 2, "cy": y + h / 2,
            "top": y + h, "bottom": y, "left": x, "right": x + w}


def _plate(ax, x, y, text, *, color=NAVY, fontsize=9, bold=True):
    """
    Draw an opaque nameplate centred at (x, y).
    Callers must choose (x, y) so the whole plate clears the association stroke.
    """
    lines = text.split("\n")
    tw = max(0.45, 0.13 * max(len(s) for s in lines) + 0.28)
    th = 0.4 if len(lines) == 1 else 0.3 * len(lines) + 0.22
    ax.add_patch(
        FancyBboxPatch(
            (x - tw / 2, y - th / 2),
            tw,
            th,
            boxstyle="round,pad=0.02,rounding_size=0.06",
            linewidth=1.0,
            edgecolor="#8A96A0",
            facecolor="white",
            zorder=7,
        )
    )
    ax.text(
        x,
        y,
        text,
        ha="center",
        va="center",
        fontsize=fontsize,
        fontweight="bold" if bold else "normal",
        color=color,
        zorder=8,
        clip_on=False,
    )


def _mult(ax, x, y, symbol):
    """Small cardinality badge."""
    _plate(ax, x, y, symbol, fontsize=11, bold=True, color=NAVY)


def _stroke(ax, points):
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    ax.plot(xs, ys, color=NAVY, linewidth=1.7, solid_capstyle="round", zorder=2)


def draw_erd():
    # Extra-wide canvas; equal aspect so sideways offsets stay visually clear of strokes
    fig, ax = plt.subplots(figsize=(15, 12))
    ax.set_xlim(0, 15)
    ax.set_ylim(-2.4, 10)
    ax.set_aspect("equal", adjustable="box")
    ax.axis("off")
    ax.set_title(
        "Figure: UML-style class / entity diagram (Tranz-Algo MVP)",
        fontsize=15,
        color=NAVY,
        pad=8,
        fontweight="bold",
    )

    # Columns: left cluster | centre | right (Sale + FX)
    users = _uml_class(
        ax, 0.45, 7.15, 2.5, "User",
        ["+ id: int {PK}", "+ email: string {UK}", "+ password_hash: string", "+ role: string"],
    )
    products = _uml_class(
        ax, 4.2, 7.15, 2.85, "Product",
        ["+ id: int {PK}", "+ sku: string {UK}", "+ stock_on_hand: decimal", "+ active_retail_price: decimal"],
    )
    fx = _uml_class(
        ax, 11.3, 7.25, 2.7, "FxRateCache",
        ["+ id: int {PK}", "+ base_currency: string", "+ quote_currency: string", "+ rate: decimal"],
    )
    batches = _uml_class(
        ax, 1.1, 3.75, 3.4, "ShipmentBatch",
        [
            "+ id: int {PK}",
            "+ reference: string {UK}",
            "+ primary_cost_mode: string",
            "+ shipping_total / duty_total / vat_total",
            "+ exchange_rate: decimal",
            "+ status: string",
        ],
    )
    items = _uml_class(
        ax, 6.3, 3.95, 3.0, "BatchItem",
        [
            "+ id: int {PK}",
            "+ quantity: decimal",
            "+ landed_unit_cost: decimal",
            "+ accepted_retail_price: decimal",
        ],
    )
    costs = _uml_class(
        ax, 0.4, 0.4, 2.7, "CostEntry",
        ["+ id: int {PK}", "+ charge_type: string", "+ amount: decimal", "+ entry_mode: string"],
    )
    ledger = _uml_class(
        ax, 4.3, 0.4, 3.0, "LedgerEntry",
        ["+ id: int {PK}", "+ event_type: string", "+ payload_json: json", "«Cost history»"],
    )
    sales = _uml_class(
        ax, 11.15, 0.5, 2.85, "Sale",
        ["+ id: int {PK}", "+ quantity: decimal", "+ unit_price: decimal", "+ stock_after: decimal"],
    )

    rail = (items["right"] + fx["left"]) / 2

    # --- strokes first ---------------------------------------------------
    # User → ShipmentBatch
    x_u = users["cx"]
    _stroke(ax, [(x_u, users["bottom"]), (x_u, batches["top"])])
    # ShipmentBatch → BatchItem
    y_c = batches["cy"]
    _stroke(ax, [(batches["right"], y_c), (items["left"], y_c)])
    # Product → BatchItem
    x_p = products["cx"]
    y_ap = items["top"] + 1.0
    _stroke(ax, [(x_p, products["bottom"]), (x_p, y_ap), (items["cx"], y_ap), (items["cx"], items["top"])])
    # ShipmentBatch → CostEntry
    x_has = batches["left"] + 0.6
    y_has = costs["top"] + 0.85
    _stroke(ax, [(x_has, batches["bottom"]), (x_has, y_has), (costs["cx"], y_has), (costs["cx"], costs["top"])])
    # ShipmentBatch → LedgerEntry
    x_aud = batches["right"] - 0.55
    y_aud = ledger["top"] + 0.85
    _stroke(ax, [(x_aud, batches["bottom"]), (x_aud, y_aud), (ledger["cx"], y_aud), (ledger["cx"], ledger["top"])])
    # Product → Sale
    _stroke(
        ax,
        [
            (products["right"], products["cy"]),
            (rail, products["cy"]),
            (rail, sales["top"] + 0.9),
            (sales["cx"], sales["top"] + 0.9),
            (sales["cx"], sales["top"]),
        ],
    )

    # --- multiplicities: always offset beside the stroke, never on corners --
    # User → ShipmentBatch (vertical at x_u)
    _mult(ax, x_u - 0.75, users["bottom"] - 0.5, "1")
    _mult(ax, x_u - 0.75, batches["top"] + 0.5, "*")

    # ShipmentBatch → BatchItem (horizontal at y_c) — both badges below the line
    gap = items["left"] - batches["right"]
    _mult(ax, batches["right"] + gap * 0.28, y_c - 0.6, "1")
    _mult(ax, items["left"] - gap * 0.28, y_c - 0.6, "*")

    # Product → BatchItem — 1 left of vertical drop; * right of final stub into BatchItem
    _mult(ax, x_p - 0.75, products["bottom"] - 0.5, "1")
    _mult(ax, items["cx"] + 0.75, items["top"] + 0.55, "*")

    # ShipmentBatch → CostEntry
    _mult(ax, x_has + 0.75, batches["bottom"] - 0.5, "1")
    _mult(ax, costs["cx"] + 0.75, costs["top"] + 0.5, "*")

    # ShipmentBatch → LedgerEntry
    _mult(ax, x_aud - 0.75, batches["bottom"] - 0.5, "1")
    _mult(ax, ledger["cx"] + 0.75, ledger["top"] + 0.5, "*")

    # Product → Sale — 1 above the outbound stub; * left of stub into Sale top
    _mult(ax, products["right"] + 0.6, products["cy"] + 0.6, "1")
    _mult(ax, sales["cx"] - 0.75, sales["top"] + 0.5, "*")

    _plate(ax, fx["cx"], fx["bottom"] - 0.7, "standalone lookup\n(no FK association)", color=TEAL, fontsize=9, bold=False)

    # Relationship names in a bottom legend — keeps connector lines free of text
    ax.add_patch(
        FancyBboxPatch(
            (0.35, -2.25),
            14.2,
            2.1,
            boxstyle="round,pad=0.02,rounding_size=0.08",
            linewidth=1.4,
            edgecolor=NAVY,
            facecolor="#F7FAFB",
            zorder=1,
        )
    )
    ax.text(0.55, -0.35, "Association legend (UML)", ha="left", va="top", fontsize=11, fontweight="bold", color=NAVY)
    legend = [
        ("creates", "User (1) → ShipmentBatch (*)"),
        ("contains", "ShipmentBatch (1) → BatchItem (*)"),
        ("appears on", "Product (1) → BatchItem (*)"),
        ("has", "ShipmentBatch (1) → CostEntry (*)"),
        ("audited by", "ShipmentBatch (1) → LedgerEntry (*)"),
        ("Record sale", "Product (1) → Sale (*)"),
        ("records", "User (1) → Sale (*)  [line omitted for clarity]"),
    ]
    for i, (name, desc) in enumerate(legend):
        col = i % 2
        row = i // 2
        x = 0.55 + col * 7.2
        y = -0.7 - row * 0.38
        ax.text(x, y, f"{name}:  {desc}", ha="left", va="top", fontsize=9, color=LINE, family="monospace")

    ax.set_ylim(-2.5, 10.2)

    path = FIG_DIR / "erd.png"
    fig.savefig(path, dpi=PRINT_DPI, bbox_inches="tight", facecolor=WHITE, pad_inches=0.35)
    plt.close(fig)
    return path


def draw_true_cost_workflow():
    fig, ax = plt.subplots(figsize=(10.5, 3.8))
    ax.set_xlim(0, 10.5)
    ax.set_ylim(0, 3.8)
    ax.axis("off")
    ax.set_title("Figure: True Cost workflow", fontsize=15, color=NAVY, pad=8, fontweight="bold")

    steps = [
        (0.25, "Draft\nshipment"),
        (2.15, "Allocate\nqty / weight"),
        (4.05, "Landed\nunit cost"),
        (5.95, "Suggest RP\n+ safety floor"),
        (7.85, "Commit"),
        (9.15, "Cost history\n+ stock"),
    ]
    for i, (x, label) in enumerate(steps):
        w = 1.55 if i < 5 else 1.2
        _box(ax, x, 1.35, w, 1.2, label, fc=TEAL if i < 5 else ACCENT, fontsize=9.5)
        if i < len(steps) - 1:
            x2 = steps[i + 1][0]
            _arrow(ax, x + w, 1.95, x2, 1.95)

    ax.text(
        5.25,
        0.55,
        "Modes: Already-Local  |  Auto FX     ·     Duty/VAT from paperwork totals",
        ha="center",
        fontsize=10,
        color=LINE,
        fontweight="bold",
    )
    fig.tight_layout()
    path = FIG_DIR / "true_cost_workflow.png"
    fig.savefig(path, dpi=PRINT_DPI, bbox_inches="tight", facecolor=WHITE)
    plt.close(fig)
    return path


def draw_dual_modes():
    fig, ax = plt.subplots(figsize=(9.5, 4.5))
    ax.set_xlim(0, 9.5)
    ax.set_ylim(0, 4.5)
    ax.axis("off")
    ax.set_title("Figure: Dual cost-entry modes", fontsize=15, color=NAVY, pad=8, fontweight="bold")

    _box(ax, 3.2, 3.5, 3.0, 0.7, "Shipment create", fc=NAVY, fontsize=11)
    _arrow(ax, 4.7, 3.5, 2.3, 2.85)
    _arrow(ax, 4.7, 3.5, 7.1, 2.85)

    _box(ax, 0.5, 1.7, 3.6, 1.2, "Already-Local\nLocal unit product cost\nNo Fetch FX required", fc=TEAL, fontsize=10)
    _box(ax, 5.4, 1.7, 3.6, 1.2, "Auto FX\nForeign unit × rate\nFetch FX / cache / manual", fc=TEAL, fontsize=10)

    _arrow(ax, 2.3, 1.7, 4.7, 1.15)
    _arrow(ax, 7.1, 1.7, 4.7, 1.15)
    _box(ax, 2.7, 0.35, 4.0, 0.8, "Allocate shipping + duty + VAT\n→ landed → suggested retail", fc=ACCENT, fontsize=10)

    fig.tight_layout()
    path = FIG_DIR / "dual_modes.png"
    fig.savefig(path, dpi=PRINT_DPI, bbox_inches="tight", facecolor=WHITE)
    plt.close(fig)
    return path


def draw_all():
    paths = [
        draw_architecture(),
        draw_erd(),
        draw_true_cost_workflow(),
        draw_dual_modes(),
    ]
    for p in paths:
        print(p)
    return paths


if __name__ == "__main__":
    draw_all()
