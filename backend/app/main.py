from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, families, invitations, users
from app.core.config import settings
from app.core.errors import http_exception_handler, validation_exception_handler

app = FastAPI(title="Finanzas Familiares API", version="1.0.0")

cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(families.router, prefix="/api/v1/families", tags=["families"])
app.include_router(invitations.router, prefix="/api/v1", tags=["invitations"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
