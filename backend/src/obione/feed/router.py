"""HTTP route for the feed (US11)."""

from fastapi import APIRouter, Query

from obione.auth.dependencies import CurrentUser, get_uow
from obione.feed import service
from obione.feed.schemas import FeedResponse

router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("", response_model=FeedResponse)
def get_feed(user: CurrentUser, limit: int = Query(default=50, ge=1, le=200)) -> FeedResponse:
    events = service.build_feed_for_user(get_uow(), user, limit=limit)
    return FeedResponse(events=events)
