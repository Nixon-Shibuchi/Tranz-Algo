from fastapi import APIRouter

from app.api.v1 import admin, auth, fx, inventory, products, shipments

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(admin.router)
api_router.include_router(products.router)
api_router.include_router(shipments.router)
api_router.include_router(fx.router)
api_router.include_router(inventory.router)


@api_router.get("/health", tags=["health"])
def health():
    return {"status": "ok", "service": "tranz-algo"}
