"""Admin CLI.

Usage:
    python -m obione.cli create-user --email x@y.com --password secret --role admin --name "Name"
"""
import argparse
import sys

from obione.auth.schemas import UserCreate
from obione.auth.service import create_user
from obione.unit_of_work import SqlAlchemyUnitOfWork


def cmd_create_user(args: argparse.Namespace) -> int:
    try:
        user = create_user(
            SqlAlchemyUnitOfWork(),
            UserCreate(
                email=args.email,
                password=args.password,
                name=args.name,
                role=args.role,
            ),
        )
        print(f"User created: id={user.id} email={user.email} role={user.role}")
        return 0
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


def main() -> int:
    parser = argparse.ArgumentParser(prog="obione")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("create-user", help="Create a user")
    p.add_argument("--email", required=True)
    p.add_argument("--password", required=True)
    p.add_argument("--name", required=True)
    p.add_argument("--role", choices=["consultant", "client", "admin"], required=True)
    p.set_defaults(func=cmd_create_user)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
