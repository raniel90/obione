"""HTTP routes for the auth bounded context."""
from fastapi import APIRouter, Depends

from obione.auth import service
from obione.auth.dependencies import CurrentUser, get_uow, require_role
from obione.auth.schemas import LoginRequest, TokenResponse, UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    token, expires_in, _user = service.authenticate(
        get_uow(), email=payload.email, password=payload.password
    )
    return TokenResponse(access_token=token, expires_in=expires_in)


@router.get("/me", response_model=UserResponse)
def me(user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(user)


@router.post(
    "/users",
    response_model=UserResponse,
    status_code=201,
    dependencies=[Depends(require_role("admin"))],
)
def create_user(payload: UserCreate) -> UserResponse:
    user = service.create_user(get_uow(), payload)
    return UserResponse.model_validate(user)
