from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Product, Sale, ShipmentBatch, User
from app.schemas import ProductOut, SaleCreate, SaleOut, SummaryOut
from app.services.costing import money

router = APIRouter(tags=["inventory-reports"])


@router.get("/inventory", response_model=list[ProductOut])
def inventory(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return list(db.scalars(select(Product).order_by(Product.sku)).all())


def _sale_out(sale: Sale) -> SaleOut:
    product = sale.product
    qty = float(sale.quantity)
    unit = float(sale.unit_price) if sale.unit_price is not None else None
    line = money(qty * unit) if unit is not None else None
    return SaleOut(
        id=sale.id,
        product_id=sale.product_id,
        sku=product.sku if product else "",
        name=product.name if product else "",
        quantity=qty,
        unit_price=unit,
        line_total=line,
        note=sale.note,
        stock_after=float(sale.stock_after or 0),
        created_at=sale.created_at,
    )


@router.get("/inventory/sales", response_model=list[SaleOut])
def list_sales(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = db.scalars(
        select(Sale)
        .options(joinedload(Sale.product))
        .order_by(Sale.created_at.desc(), Sale.id.desc())
        .limit(limit)
    ).unique().all()
    return [_sale_out(s) for s in rows]


@router.post("/inventory/sales", response_model=SaleOut)
def record_sale(
    payload: SaleCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    product = db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    qty = float(payload.quantity)
    on_hand = float(product.stock_on_hand or 0)
    if qty > on_hand:
        raise HTTPException(
            status_code=422,
            detail=f"Only {on_hand:g} unit(s) available for {product.sku}.",
        )

    unit_price = payload.unit_price
    if unit_price is None and product.active_retail_price is not None:
        unit_price = float(product.active_retail_price)
    if unit_price is not None:
        unit_price = money(unit_price)

    new_stock = money(on_hand - qty)
    product.stock_on_hand = new_stock
    sale = Sale(
        product_id=product.id,
        quantity=qty,
        unit_price=unit_price,
        stock_after=new_stock,
        note=(payload.note or "").strip() or None,
        created_by=user.id,
    )
    db.add(sale)
    db.commit()
    db.refresh(sale)
    sale = db.scalars(
        select(Sale).where(Sale.id == sale.id).options(joinedload(Sale.product))
    ).unique().one()
    return _sale_out(sale)


@router.get("/reports/summary", response_model=SummaryOut)
def summary(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    products = db.scalar(select(func.count()).select_from(Product)) or 0
    shipments = db.scalar(select(func.count()).select_from(ShipmentBatch)) or 0
    drafts = (
        db.scalar(
            select(func.count()).select_from(ShipmentBatch).where(ShipmentBatch.status == "draft")
        )
        or 0
    )
    committed = (
        db.scalar(
            select(func.count())
            .select_from(ShipmentBatch)
            .where(ShipmentBatch.status == "committed")
        )
        or 0
    )
    return SummaryOut(
        products=products,
        shipments=shipments,
        draft_shipments=drafts,
        committed_shipments=committed,
    )
