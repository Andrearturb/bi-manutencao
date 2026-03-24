from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
def healthcheck() -> dict:
    return {"status": "ok"}