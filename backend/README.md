# EventHub backend (Stage 4)

Spring Boot 3.3 · Java 17+ · MySQL 8 · Spring Security with JWT.

## What exists
| Endpoint | Who | Notes |
|---|---|---|
| `POST /api/auth/signup` | anyone | Always creates a STUDENT. |
| `POST /api/auth/login` | anyone | Returns `{ token, user }`. |
| `GET /api/users/me` | logged in | |
| `GET /api/events`, `GET /api/events/{id}` | anyone | Server computes `registered`, `seatsLeft`, `status`. |
| `GET /api/categories` | anyone | |
| `GET /api/events/mine` | organizer, admin | Own events incl. archived (admin: all). |
| `POST/PUT /api/events`, `DELETE /api/events/{id}` | organizer, admin | Organizers may only touch their own events. DELETE = archive. |
| `GET /api/admin/users`, `PUT /api/admin/users/{id}/role` | admin | How a student becomes an organizer. |

**Not built yet (Stage 5):** register / cancel / team registration endpoints, QR tickets, check-in, dashboards.
The `Registration` and `TeamMember` tables exist so seat counts work, but nothing can create registrations via the API yet.

## Structure
    controller/   HTTP endpoints only (thin)
    service/      business rules (AuthService, EventService)
    repository/   database access (Spring Data JPA)
    entity/       tables: User, Category, Event, Registration, TeamMember
    dto/          request/response shapes (entities are never sent to the browser)
    security/     JwtService, JwtAuthFilter, AuthUser
    config/       SecurityConfig (URL rules, CORS, BCrypt), DataSeeder
    exception/    consistent JSON errors

## 1. Prerequisites
    java -version      # 17 or newer
    mvn -v             # Apache Maven 3.9+  (or open backend/ in IntelliJ and let it import Maven)
    mysql --version    # MySQL 8, running on localhost:3306

## 2. Configure (environment variables: nothing secret lives in the code)
| Variable | Required | Meaning |
|---|---|---|
| `DB_PASSWORD` | if your MySQL user has a password | MySQL password |
| `DB_USER` | no (default `root`) | MySQL user |
| `JWT_SECRET` | **yes** | Random string, **32+ characters**. App refuses to start without it. |
| `SEED_DEMO` | no | `true` loads demo events + 3 accounts on first start |
| `SEED_PASSWORD` | with SEED_DEMO | Password for the 3 demo accounts (8+ chars, letters and numbers) |

The database `eventhub` is created automatically. Tables are created automatically on first start.

**macOS / Linux / Git Bash**

    export DB_PASSWORD='your-mysql-password'
    export JWT_SECRET="$(openssl rand -base64 48)"
    export SEED_DEMO=true
    export SEED_PASSWORD='ChooseSomething1'

**Windows PowerShell**

    $env:DB_PASSWORD = 'your-mysql-password'
    $env:JWT_SECRET  = 'any-long-random-string-of-at-least-32-characters'
    $env:SEED_DEMO = 'true'
    $env:SEED_PASSWORD = 'ChooseSomething1'

### Keep the credentials between terminals: `backend/.env` (recommended)
Environment variables vanish when you open a new terminal, and Spring Boot does not read `.env` files by itself, so a fresh terminal means an **empty** password. `application.properties` therefore imports an optional, git-ignored `backend/.env`:

    bash configure-env.sh        # asks for the MySQL user/password (hidden) and writes backend/.env

or copy `.env.example` to `.env` and edit it. Real environment variables, if set, still take priority over `.env`. Never commit `.env` (it is git-ignored) and never paste its contents into chat or issues.

## 3. Run
    cd backend
    mvn spring-boot:run

Success looks like `Started EventHubApplication` and port 8080. Quick check: open http://localhost:8080/api/events in a browser (JSON list of 9 events when seeded).

Demo accounts (password = your `SEED_PASSWORD`): `demo@student.edu` (student), `organizer@student.edu`, `admin@student.edu`.

## 4. Verify (please do this before Stage 5)
With the backend running and `SEED_PASSWORD` exported in the same terminal:

    cd backend
    bash verify.sh

It checks ~40 behaviours (validation, wrong passwords, forged tokens, role rules, ownership, archive). Everything should print PASS. Send me any FAIL lines.

## Common errors
| Message | Fix |
|---|---|
| `Access denied for user 'root'@'localhost' (using password: NO)` | The app got an **empty** password: `DB_PASSWORD` was not set in the terminal running Maven. Create `backend/.env` (`bash configure-env.sh`) or export `DB_PASSWORD`. (`using password: YES` instead means the password was supplied but is wrong.) |
| `Unable to determine Dialect without JDBC metadata` | A follow-on error: Hibernate could not connect to MySQL. Fix the connection error above it. |
| `Could not resolve placeholder 'JWT_SECRET'` | Export JWT_SECRET in the same terminal you run Maven from. |
| `JWT_SECRET must be at least 32 characters` | Use a longer secret. |
| `Access denied for user 'root'` / `Communications link failure` | Wrong `DB_PASSWORD`, or MySQL not running. |
| `Unsupported class file major version` / `release version 17 not supported` | Your Java is older than 17. |
| `SEED_DEMO=true needs SEED_PASSWORD` | Set SEED_PASSWORD (8+ chars, letters and numbers). |
| Port 8080 already in use | Stop the other app, or run with `--server.port=8081`. |

## Security notes
- Passwords are hashed with BCrypt; the hash is never returned by any endpoint.
- Tokens are signed (HS256) and expire after 2 hours; the user's role is re-read from the database on every request.
- Role rules are enforced on the server in `SecurityConfig` and `EventService`; hiding buttons in React is only cosmetic.
- Not yet done: login rate-limiting, refresh tokens, HTTPS (a deployment concern), audit logging.
