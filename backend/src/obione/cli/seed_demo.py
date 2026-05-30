"""Rich demo seed for the ObiOne frontend.

Creates a coherent dataset so a developer can poke around all the endpoints
without typing data:

- Admin + 1 consultant + 3 clients (password = demo12345678 for all).
- 4 projects, one per main segment (legal, health, sports, gastronomy),
  each with a realistic description (≥ 200 chars) and an LLM extraction
  (via the mock provider).
- Clients linked to the first 3 projects via project_clients.
- CBAC configured on the first project releasing the "conteudo_geral"
  category so cliente1 already sees something.
- One accepted theme suggestion on the second project to show the
  RF19 flow with a non-trivial trail.

The script is idempotent: rerunning it purges the previous demo entities
(by email) and recreates them from scratch.
"""

from __future__ import annotations

import sys
import traceback

from sqlalchemy import select

from obione.auth.models import User
from obione.auth.security import hash_password
from obione.extractions.llm.mock import MockExtractor
from obione.extractions.service import extract_for_project
from obione.projects.models import Project, ProjectClient
from obione.projects.schemas import ProjectCreate
from obione.projects.service import add_client_to_project, create_project
from obione.shared.database import SessionLocal
from obione.themes.generator.mock import MockThemeClassifier
from obione.themes.service import accept_suggestion, suggest_theme
from obione.unit_of_work import SqlAlchemyUnitOfWork
from obione.visibility.service import set_category

DEMO_PASSWORD = "demo12345678"

ADMIN_EMAIL = "admin@obione.dev"
CONSULTOR_EMAIL = "consultor@obione.dev"
CLIENT_EMAILS = [
    "cliente1@obione.dev",
    "cliente2@obione.dev",
    "cliente3@obione.dev",
]
DEMO_EMAILS = [ADMIN_EMAIL, CONSULTOR_EMAIL, *CLIENT_EMAILS]


PROJECT_BLUEPRINTS = [
    # (name, domain, description). Descriptions intentionally include
    # keywords the MockThemeClassifier can match, so RF19's suggestion
    # looks meaningful in the demo.
    (
        "Freire Batista ADV",
        "legal",
        "Atendimento jurídico contínuo para o escritório Freire Batista Advocacia "
        "em Pernambuco. Cobre a gestão dos processos judiciais ativos, contratos "
        "de prestação de serviço e atendimento de clientes do tribunal. Inclui "
        "auditoria documental e diagnóstico do branding do escritório para um "
        "reposicionamento no mercado regional. Stakeholders: advogados sócios e "
        "equipe administrativa.",
    ),
    (
        "Valença Odontologia",
        "health",
        "Consultoria de marketing digital para a Valença Odontologia, clínica de "
        "saúde bucal em Recife com foco em atendimento de pacientes B2C. O "
        "escopo cobre produção de conteúdo, gestão das redes sociais, campanhas "
        "de captação de novos pacientes e treinamento da equipe de recepção. "
        "Indicadores acompanhados: NPS, ticket médio, taxa de retenção dos "
        "pacientes ativos da clínica.",
    ),
    (
        "Kaka Jiu-Jitsu",
        "sports",
        "Reposicionamento de marca para a academia Kaka Jiu-Jitsu, com foco em "
        "atletas e praticantes do esporte de combate. O projeto cobre identidade "
        "visual, gestão das redes sociais, captação de novos alunos e calendário "
        "de competições. Treinos diários, escala de professores e logística "
        "de eventos. Indicadores: número de alunos ativos, presença nas redes, "
        "conversão em campeonatos.",
    ),
    (
        "Doceria Rios",
        "gastronomy",
        "Plano de marketing para a Doceria Rios, confeitaria boutique em Olinda "
        "com cardápio autoral. O escopo cobre estratégia gastronômica para o "
        "e-commerce, fotografia dos produtos, gestão da padaria física e "
        "parcerias com restaurantes locais. Indicadores: ticket médio, número "
        "de pedidos por semana e taxa de recompra dos clientes.",
    ),
]


def _purge_demo_entities(session) -> None:
    """Remove previously-seeded demo users + their projects (cascading
    extractions, visibility, suggestions, comments)."""
    user_ids = [
        u.id for u in session.execute(select(User).where(User.email.in_(DEMO_EMAILS))).scalars()
    ]
    if not user_ids:
        return
    session.query(ProjectClient).filter(ProjectClient.user_id.in_(user_ids)).delete(
        synchronize_session=False
    )
    session.query(Project).filter(Project.consultant_id.in_(user_ids)).delete(
        synchronize_session=False
    )
    session.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
    session.commit()


def _create_user(session, *, email: str, name: str, role: str) -> User:
    user = User(
        email=email,
        name=name,
        role=role,
        password_hash=hash_password(DEMO_PASSWORD),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def seed_demo() -> int:
    session = SessionLocal()
    try:
        print("→ Purging prior demo entities...")
        _purge_demo_entities(session)

        print("→ Creating users...")
        admin = _create_user(session, email=ADMIN_EMAIL, name="Demo Admin", role="admin")
        consultor = _create_user(
            session, email=CONSULTOR_EMAIL, name="Consultor Demo", role="consultant"
        )
        clientes = [
            _create_user(session, email=email, name=f"Cliente {i + 1}", role="client")
            for i, email in enumerate(CLIENT_EMAILS)
        ]

        uow = SqlAlchemyUnitOfWork()
        extractor = MockExtractor()
        classifier = MockThemeClassifier()

        print("→ Creating projects + running mock extractions...")
        projects = []
        for name, domain, description in PROJECT_BLUEPRINTS:
            project = create_project(
                uow,
                consultor,
                ProjectCreate(name=name, domain=domain, description=description),
            )
            extract_for_project(uow, extractor, consultor, project_id=project.id)
            projects.append(project)
            print(f"   ✓ {name} ({domain})")

        print("→ Linking the first 3 projects to clients 1-3...")
        for cli, project in zip(clientes, projects[:3], strict=False):
            add_client_to_project(uow, consultor, project.id, cli.id)

        print("→ Configuring CBAC on project 1 (cliente1 vê a categoria 'conteudo_geral')...")
        set_category(uow, consultor, projects[0].id, "conteudo_geral", True)

        print("→ Generating + accepting one theme suggestion on project 2...")
        suggestion = suggest_theme(uow, classifier, consultor, project_id=projects[1].id)
        accept_suggestion(uow, consultor, suggestion.id)

        print()
        print(f"Demo seed complete (password = {DEMO_PASSWORD}):")
        print(f"  Admin:     {admin.email}")
        print(f"  Consultor: {consultor.email}")
        for c in clientes:
            print(f"  Cliente:   {c.email}")
        print()
        print("Projects (consultor → all; clientes → only their linked one):")
        for cli, project in zip(clientes, projects[:3], strict=False):
            print(f"  - {project.name} [{project.domain}] vinculado a {cli.email}")
        # Project 4 unlinked (only consultor + admin see it).
        unlinked = projects[3]
        print(f"  - {unlinked.name} [{unlinked.domain}] (sem cliente vinculado)")
        return 0
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        traceback.print_exc()
        return 1
    finally:
        session.close()
