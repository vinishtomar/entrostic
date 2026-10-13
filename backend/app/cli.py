"""Admin commands.

    python -m app.cli create-admin --email you@example.com --name "Your Name"
    python -m app.cli seed-demo
    python -m app.cli bootstrap   # runs at container start; see below
"""

import argparse
import getpass
import os
import sys

from sqlalchemy import select

from app.core.security import MIN_PASSWORD_LENGTH, hash_password
from app.db.session import SessionLocal
from app.models import Company, CompanyStatus, Job, JobStatus, User, UserRole
from app.services.slugs import job_slug


def create_admin(email: str, name: str) -> None:
    email = email.lower()
    with SessionLocal() as db:
        if db.scalar(select(User.id).where(User.email == email)):
            sys.exit(f"A user with email {email} already exists.")
        password = getpass.getpass(f"Password for {email} (min {MIN_PASSWORD_LENGTH} chars): ")
        if len(password) < MIN_PASSWORD_LENGTH:
            sys.exit("Password too short.")
        if getpass.getpass("Repeat password: ") != password:
            sys.exit("Passwords don't match.")
        db.add(User(email=email, full_name=name, password_hash=hash_password(password), role=UserRole.ADMIN))
        db.commit()
    print(f"Admin {email} created. Sign in at http://localhost:3000/login")


def bootstrap() -> None:
    """Create the first platform admin from INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD, if set.

    For hosts without shell access. Does nothing if the variables are unset or the user exists,
    so it is safe on every start; remove the variables from the host after the first deploy.
    """
    email = os.environ.get("INITIAL_ADMIN_EMAIL", "").strip().lower()
    password = os.environ.get("INITIAL_ADMIN_PASSWORD", "")
    if not email or not password:
        return
    if len(password) < MIN_PASSWORD_LENGTH:
        sys.exit(f"INITIAL_ADMIN_PASSWORD must be at least {MIN_PASSWORD_LENGTH} characters.")
    with SessionLocal() as db:
        if db.scalar(select(User.id).where(User.email == email)):
            print(f"bootstrap: {email} already exists; nothing to do (you can remove INITIAL_ADMIN_* now).")
            return
        name = os.environ.get("INITIAL_ADMIN_NAME", "Admin")
        db.add(User(email=email, full_name=name, password_hash=hash_password(password), role=UserRole.ADMIN))
        db.commit()
    print(f"bootstrap: created platform admin {email}.")


DEMO_EMAIL = "recruiter@example.com"
DEMO_PASSWORD = "northwind-demo-2026"

DEMO_JOBS = [
    dict(
        title="Senior Backend Engineer",
        location="Berlin, Germany",
        workplace_type="hybrid",
        employment_type="full_time",
        description=(
            "Northwind Labs builds logistics software used by 2,000+ warehouses across Europe.\n\n"
            "As a Senior Backend Engineer you will design and scale the APIs behind our order-routing "
            "platform, mentor engineers, and own services end to end.\n\n"
            "What you'll do\n- Design and build high-throughput Python services\n"
            "- Improve reliability and performance of our PostgreSQL-backed systems\n"
            "- Lead technical design reviews and mentor teammates\n\n"
            "What we offer\n- Hybrid work (2 days/week in our Berlin office)\n- 30 days vacation\n- Learning budget"
        ),
        must_have_skills=["Python", "PostgreSQL", "REST APIs", "5+ years backend experience"],
        nice_to_have_skills=["FastAPI", "Kafka", "AWS", "Kubernetes"],
    ),
    dict(
        title="Data Analyst",
        location="Milan, Italy",
        workplace_type="remote",
        employment_type="full_time",
        description=(
            "Join our analytics team to turn operational data into decisions.\n\n"
            "What you'll do\n- Build dashboards for operations and finance\n- Write SQL and Python analyses\n"
            "- Partner with product managers on metrics\n\n"
            "What we offer\n- Fully remote within the EU\n- Flexible hours"
        ),
        must_have_skills=["SQL", "Python", "Dashboarding"],
        nice_to_have_skills=["dbt", "Power BI", "pandas"],
    ),
]


def seed_demo() -> None:
    with SessionLocal() as db:
        if db.scalar(select(User.id).where(User.email == DEMO_EMAIL)):
            print("Demo data already exists.")
        else:
            company = Company(name="Northwind Labs", slug="northwind-labs", website="https://northwind.example",
                              status=CompanyStatus.APPROVED)
            recruiter = User(email=DEMO_EMAIL, full_name="Alex Morgan", password_hash=hash_password(DEMO_PASSWORD),
                             role=UserRole.RECRUITER)
            company.users.append(recruiter)
            db.add(company)
            db.flush()
            for spec in DEMO_JOBS:
                db.add(Job(**spec, company_id=company.id, slug=job_slug(company.slug, spec["title"]),
                           status=JobStatus.OPEN, created_by_id=recruiter.id))
            db.commit()
            print("Demo company created.")
        for job in db.scalars(select(Job).join(Company).where(Company.slug == "northwind-labs")):
            print(f"  Job link: http://localhost:3000/j/{job.slug}")
    print(f"  Recruiter login: {DEMO_EMAIL} / {DEMO_PASSWORD}")
    print("  Careers page: http://localhost:3000/careers/northwind-labs")


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("create-admin", help="Create a platform admin (approves companies)")
    p.add_argument("--email", required=True)
    p.add_argument("--name", required=True)
    sub.add_parser("seed-demo", help="Create an approved demo company with open jobs")
    sub.add_parser("bootstrap", help="Create the first admin from INITIAL_ADMIN_* env vars (if set)")
    args = parser.parse_args()

    if args.command == "create-admin":
        create_admin(args.email, args.name)
    elif args.command == "seed-demo":
        seed_demo()
    elif args.command == "bootstrap":
        bootstrap()


if __name__ == "__main__":
    main()
