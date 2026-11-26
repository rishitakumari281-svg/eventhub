#!/usr/bin/env bash
# Smoke test for the EventHub API. Run AFTER the backend is up, started with SEED_DEMO=true.
#   export SEED_PASSWORD='the-same-password-you-started-the-backend-with'
#   bash verify.sh            (works in Git Bash on Windows, macOS, Linux)
BASE="${BASE:-http://localhost:8080}"
: "${SEED_PASSWORD:?Set SEED_PASSWORD to the value you used when starting the backend}"
pass=0; fail=0

# status <expected> <label> <curl args...>   -> prints PASS/FAIL, stores body in $BODY
status() {
  local expected="$1" label="$2"; shift 2
  local out; out=$(curl -s -m 15 -w $'\n%{http_code}' "$@")
  CODE="${out##*$'\n'}"; BODY="${out%$'\n'*}"
  if [ "$CODE" = "$expected" ]; then echo "PASS  $label ($CODE)"; pass=$((pass+1))
  else echo "FAIL  $label (expected $expected, got $CODE) $BODY"; fail=$((fail+1)); fi
}
token_of() { echo "$1" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'; }
json() { printf '%s' "$1"; }
H='Content-Type: application/json'

future=$(date -d "+30 days" +%F 2>/dev/null || date -v+30d +%F)
deadline=$(date -d "+25 days" +%F 2>/dev/null || date -v+25d +%F)
email="verify$RANDOM$RANDOM@student.edu"

echo "== Public reads"
status 200 "GET /api/events"        "$BASE/api/events"
status 200 "GET /api/categories"    "$BASE/api/categories"
status 200 "GET /api/events/1"      "$BASE/api/events/1"
status 404 "GET unknown event"      "$BASE/api/events/999999"
status 400 "GET /api/events/abc (bad id)" "$BASE/api/events/abc"

echo "== Signup / login rules"
status 400 "signup: weak password rejected" -X POST "$BASE/api/auth/signup" -H "$H" -d "{\"name\":\"T U\",\"email\":\"$email\",\"password\":\"short\"}"
status 400 "signup: bad email rejected"     -X POST "$BASE/api/auth/signup" -H "$H" -d '{"name":"T U","email":"nope","password":"Passw0rd!"}'
status 201 "signup: valid student"          -X POST "$BASE/api/auth/signup" -H "$H" -d "{\"name\":\"Test User\",\"email\":\"$email\",\"password\":\"Passw0rd!\"}"
STUDENT=$(token_of "$BODY")
echo "$BODY" | grep -q '"role":"STUDENT"' && { echo "PASS  new account is STUDENT"; pass=$((pass+1)); } || { echo "FAIL  new account is not STUDENT"; fail=$((fail+1)); }
echo "$BODY" | grep -qi 'passwordHash\|"password"' && { echo "FAIL  response leaks a password field"; fail=$((fail+1)); } || { echo "PASS  response has no password/hash"; pass=$((pass+1)); }
status 409 "signup: duplicate email"        -X POST "$BASE/api/auth/signup" -H "$H" -d "{\"name\":\"Test User\",\"email\":\"$email\",\"password\":\"Passw0rd!\"}"
status 201 "signup: cannot self-assign ADMIN (role field ignored)" -X POST "$BASE/api/auth/signup" -H "$H" -d "{\"name\":\"Sneaky\",\"email\":\"s$email\",\"password\":\"Passw0rd!\",\"role\":\"ADMIN\"}"
echo "$BODY" | grep -q '"role":"STUDENT"' && { echo "PASS  injected role ignored"; pass=$((pass+1)); } || { echo "FAIL  injected role was honoured!"; fail=$((fail+1)); }
status 401 "login: wrong password"          -X POST "$BASE/api/auth/login" -H "$H" -d "{\"email\":\"$email\",\"password\":\"wrong-pass1\"}"
status 200 "login: correct"                 -X POST "$BASE/api/auth/login" -H "$H" -d "{\"email\":\"$email\",\"password\":\"Passw0rd!\"}"

echo "== Authentication"
status 401 "GET /users/me without token"    "$BASE/api/users/me"
status 401 "GET /users/me with garbage token" "$BASE/api/users/me" -H "Authorization: Bearer abc.def.ghi"
status 200 "GET /users/me as student"       "$BASE/api/users/me" -H "Authorization: Bearer $STUDENT"
TAMPERED="${STUDENT%?}X"
status 401 "tampered token rejected"        "$BASE/api/users/me" -H "Authorization: Bearer $TAMPERED"

echo "== Authorization (roles)"
EVENT="{\"title\":\"Verify Event\",\"summary\":\"Created by verify.sh\",\"category\":\"tech\",\"type\":\"TEAM\",\"date\":\"$future\",\"time\":\"10:00\",\"venue\":\"Lab 1\",\"organizerName\":\"Test Club\",\"seats\":50,\"registrationDeadline\":\"$deadline\",\"teamMin\":2,\"teamMax\":4,\"featured\":false,\"schedule\":[{\"time\":\"10:00\",\"title\":\"Start\"}]}"
status 401 "create event: anonymous"        -X POST "$BASE/api/events" -H "$H" -d "$EVENT"
status 403 "create event: student forbidden" -X POST "$BASE/api/events" -H "$H" -H "Authorization: Bearer $STUDENT" -d "$EVENT"
status 403 "GET /events/mine: student forbidden" "$BASE/api/events/mine" -H "Authorization: Bearer $STUDENT"
status 403 "admin users: student forbidden" "$BASE/api/admin/users" -H "Authorization: Bearer $STUDENT"

status 200 "login organizer (seeded)" -X POST "$BASE/api/auth/login" -H "$H" -d "{\"email\":\"organizer@student.edu\",\"password\":\"$SEED_PASSWORD\"}"
ORG=$(token_of "$BODY")
status 201 "create event: organizer" -X POST "$BASE/api/events" -H "$H" -H "Authorization: Bearer $ORG" -d "$EVENT"
ID=$(echo "$BODY" | sed -n 's/.*"id":\([0-9]*\).*/\1/p' | head -1)
echo "$BODY" | grep -q '"status":"OPEN"' && { echo "PASS  server computed status OPEN"; pass=$((pass+1)); } || { echo "FAIL  expected status OPEN"; fail=$((fail+1)); }
status 400 "create event: deadline after event date" -X POST "$BASE/api/events" -H "$H" -H "Authorization: Bearer $ORG" -d "${EVENT/\"registrationDeadline\":\"$deadline\"/\"registrationDeadline\":\"2099-01-01\"}"
status 400 "create event: missing title (validation)" -X POST "$BASE/api/events" -H "$H" -H "Authorization: Bearer $ORG" -d '{"title":""}'
status 200 "update own event" -X PUT "$BASE/api/events/$ID" -H "$H" -H "Authorization: Bearer $ORG" -d "${EVENT/Verify Event/Verify Event v2}"
status 200 "GET /events/mine: organizer" "$BASE/api/events/mine" -H "Authorization: Bearer $ORG"

status 200 "login admin (seeded)" -X POST "$BASE/api/auth/login" -H "$H" -d "{\"email\":\"admin@student.edu\",\"password\":\"$SEED_PASSWORD\"}"
ADMIN=$(token_of "$BODY")
status 200 "admin users: admin allowed" "$BASE/api/admin/users" -H "Authorization: Bearer $ADMIN"
ME=$(curl -s "$BASE/api/users/me" -H "Authorization: Bearer $ADMIN" | sed -n 's/.*"id":\([0-9]*\).*/\1/p')
status 400 "admin cannot change own role" -X PUT "$BASE/api/admin/users/$ME/role" -H "$H" -H "Authorization: Bearer $ADMIN" -d '{"role":"STUDENT"}'

echo "== Ownership: a different organizer cannot touch someone else's event"
SID=$(curl -s "$BASE/api/users/me" -H "Authorization: Bearer $STUDENT" | sed -n 's/.*"id":\([0-9]*\).*/\1/p')
status 200 "admin promotes the test student to ORGANIZER" -X PUT "$BASE/api/admin/users/$SID/role" -H "$H" -H "Authorization: Bearer $ADMIN" -d '{"role":"ORGANIZER"}'
status 403 "other organizer cannot edit event" -X PUT "$BASE/api/events/$ID" -H "$H" -H "Authorization: Bearer $STUDENT" -d "$EVENT"
status 403 "other organizer cannot archive event" -X DELETE "$BASE/api/events/$ID" -H "Authorization: Bearer $STUDENT"

echo "== Archive (soft delete)"
status 204 "owner archives event" -X DELETE "$BASE/api/events/$ID" -H "Authorization: Bearer $ORG"
status 404 "archived event hidden from public" "$BASE/api/events/$ID"

echo; echo "RESULT: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
