#!/usr/bin/env bash
# Creates backend/.env (git-ignored) holding your LOCAL MySQL credentials, so you no longer have to
# export variables in every terminal. The password is typed at a hidden prompt, is never printed,
# and is never sent anywhere. Works in Git Bash, macOS and Linux:   bash configure-env.sh
set -e
cd "$(dirname "$0")"

if [ -f .env ]; then
  read -r -p ".env already exists. Overwrite it? [y/N] " ans
  [ "$ans" = "y" ] || [ "$ans" = "Y" ] || { echo "Left .env unchanged."; exit 0; }
fi

read -r -p "MySQL user [root]: " user; user=${user:-root}
read -r -s -p "MySQL password (hidden; leave empty only if your MySQL user truly has none): " pass; echo
read -r -s -p "JWT secret, 32+ characters (hidden; press Enter to generate one): " jwt; echo
if [ -z "$jwt" ]; then
  jwt=$( (openssl rand -base64 48 2>/dev/null || head -c 48 /dev/urandom | base64) | tr -d '\n=' )
  echo "Generated a random JWT secret. (Changing it later only logs everyone out.)"
fi
if [ "${#jwt}" -lt 32 ]; then echo "JWT secret must be at least 32 characters. Nothing written." >&2; exit 1; fi

# .env is read as a Java properties file: a backslash must be doubled to be read back correctly.
esc() { printf '%s' "${1//\\/\\\\}"; }

umask 077
{
  printf 'DB_USER=%s\n' "$(esc "$user")"
  printf 'DB_PASSWORD=%s\n' "$(esc "$pass")"
  printf 'JWT_SECRET=%s\n' "$(esc "$jwt")"
} > .env
echo "Wrote $(pwd)/.env (git-ignored). Start the backend with: mvn spring-boot:run"
