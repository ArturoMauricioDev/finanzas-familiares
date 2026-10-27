from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, users, families, invitations

app = FastAPI(title="Finanzas Familiares API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(families.router, prefix="/api/v1/families", tags=["families"])
app.include_router(invitations.router, prefix="/api/v1", tags=["invitations"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
