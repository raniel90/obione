from obione.shared.exceptions import ForbiddenError, NotFoundError


class ProjectNotFoundError(NotFoundError):
    code = "project_not_found"


class NotProjectOwnerError(ForbiddenError):
    code = "not_project_owner"


class ClientCannotMutateError(ForbiddenError):
    code = "client_cannot_mutate"
