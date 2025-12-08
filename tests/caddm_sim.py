import csv
import random
import time
from typing import Dict, List, Tuple

import requests

# ==============================================================
# CONFIGURATION
# ==============================================================

API_BASE = "http://localhost:3000/api"
QUERY_URL = f"{API_BASE}/query"
REGISTER_URL = f"{API_BASE}/auth/register"
LOGIN_URL = f"{API_BASE}/auth/login"

N_IDENTITIES = 250              # Number of unique identities to simulate
N_REQUESTS = 5000               # Total number of query requests to simulate
ATTACKER_RATE = 0.12            # Proportion of identities that are attackers

# Behavioral tuning
ATTACKER_DEVICE_ROTATION = 0.65
LEGIT_DEVICE_ROTATION = 0.05
ATTACKER_BAD_IP_CHANCE = 0.70
LEGIT_NEW_IP_CHANCE = 0.08
ATTACKER_FAILED_LOGIN_CHANCE = 0.60
LEGIT_FAILED_LOGIN_CHANCE = 0.08
FAILED_LOGIN_BURST = (1, 3)

# ==============================================================
# QUERIES
# ==============================================================

SAFE_QUERIES = [
    "SELECT id, first_name, last_name FROM employee_table WHERE id <= 20",
    "SELECT id, first_name, last_name, department FROM employee_table LIMIT 5",
    "SELECT id, first_name, last_name, department, job_title FROM employee_table LIMIT 10",
]

SENSITIVE_QUERIES = [
    "SELECT id, ssn, salary FROM employee_table",
    "SELECT ssn, salary, race, gender, email, phone FROM employee_table",
    "SELECT first_name, last_name, ssn, salary, race, gender FROM employee_table",
    "SELECT * FROM employee_table",
]

SENSITIVE_COLUMNS = ["ssn", "salary", "race", "gender", "email", "phone"]


# ==============================================================
# IDENTITY AND DEVICE SETUP
# ==============================================================

ROLES = ["user", "analyst", "admin"]


def random_public_ip() -> str:
    block = random.choice(["203.0.113", "198.51.100", "192.0.2"])
    return f"{block}.{random.randint(1, 254)}"


def base_device() -> Dict[str, str]:
    chrome_version = random.randint(118, 122)
    platform = random.choice(["Win32", "MacIntel", "Linux x86_64"])
    tz = random.choice(
        ["UTC", "America/New_York", "Europe/London", "Asia/Singapore"]
    )
    screen_width, screen_height = random.choice(
        [(1920, 1080), (1366, 768), (2560, 1440)]
    )

    return {
        "userAgent": (
            f"Mozilla/5.0 ({platform}) AppleWebKit/537.36 "
            f"(KHTML, like Gecko) Chrome/{chrome_version}.0.0.0 Safari/537.36"
        ),
        "platform": platform,
        "language": random.choice(["en-US", "en-GB", "es-ES"]),
        "timezone": tz,
        "screenWidth": screen_width,
        "screenHeight": screen_height,
    }


def mutate_device(device: Dict[str, str]) -> Dict[str, str]:
    updated = dict(device)
    updated["platform"] = random.choice(
        ["Win32", "MacIntel", "Linux x86_64", device["platform"]]
    )
    updated["timezone"] = random.choice(
        ["UTC", "America/New_York", "Europe/London", "Asia/Singapore"]
    )
    updated["screenWidth"], updated["screenHeight"] = random.choice(
        [(1920, 1080), (1536, 864), (2560, 1440), (1280, 720)]
    )

    new_version = random.randint(118, 130)
    if "Chrome/" in updated["userAgent"]:
        prefix, remainder = updated["userAgent"].split("Chrome/", 1)
        suffix = remainder.split(" ", 1)[1] if " " in remainder else ""
        updated["userAgent"] = (
            f"{prefix}Chrome/{new_version}.0.0.0 {suffix}".strip()
        )
    return updated


def generate_identities(n: int = N_IDENTITIES) -> List[Dict[str, str]]:
    identities = []
    role_weights = [0.6, 0.25, 0.15]  # user-heavy population

    for i in range(n):
        role = random.choices(ROLES, weights=role_weights, k=1)[0]
        attacker = random.random() < ATTACKER_RATE
        username = f"sim_{role}_{i}"

        identities.append(
            {
                "username": username,
                "password": f"Pass!{i}{random.randint(100, 999)}",
                "role": role,
                "attacker": attacker,
                "device": base_device(),
            }
        )

    return identities


# ==============================================================
# API HELPERS
# ==============================================================

def choose_query(attacker: bool) -> str:
    if attacker and random.random() < 0.7:
        return random.choice(SENSITIVE_QUERIES)
    return random.choice(SAFE_QUERIES)


def safe_post(
    session: requests.Session, url: str, json: Dict, headers: Dict
) -> Tuple[int, Dict]:
    try:
        resp = session.post(url, json=json, headers=headers, timeout=8)
        try:
            return resp.status_code, resp.json()
        except ValueError:
            return resp.status_code, {"error": "Non-JSON response"}
    except requests.RequestException as exc:
        return -1, {"error": str(exc)}


def register_and_prime(session: requests.Session, identity: Dict[str, str]) -> None:
    payload = {
        "username": identity["username"],
        "password": identity["password"],
        "role": identity["role"],
    }
    headers = {"Content-Type": "application/json"}

    code, data = safe_post(session, REGISTER_URL, payload, headers)
    if code not in (200, 201, 400):
        print(f"[warn] register {identity['username']} -> {code} {data}")

    # Prime device and IP history with one clean login
    safe_post(
        session,
        LOGIN_URL,
        {
            "username": identity["username"],
            "password": identity["password"],
            "device": identity["device"],
        },
        headers,
    )


def detect_leak(data: Dict) -> bool:
    rows = data.get("rows")
    if not rows:
        return False

    row = rows[0]
    for col in SENSITIVE_COLUMNS:
        val = row.get(col)
        if val and val not in ("REDACTED", "******"):
            return True
    return False


def simulate_request(session: requests.Session, identity: Dict[str, str]) -> Dict:
    attacker = identity["attacker"]
    target_query = choose_query(attacker)

    spoofed_ip = False
    ip_header = None
    if attacker and random.random() < ATTACKER_BAD_IP_CHANCE:
        ip_header = random_public_ip()
        spoofed_ip = True
    elif not attacker and random.random() < LEGIT_NEW_IP_CHANCE:
        ip_header = random_public_ip()
        spoofed_ip = True

    new_device = False
    query_device = identity["device"]
    if attacker and random.random() < ATTACKER_DEVICE_ROTATION:
        query_device = mutate_device(identity["device"])
        new_device = True
    elif not attacker and random.random() < LEGIT_DEVICE_ROTATION:
        query_device = mutate_device(identity["device"])
        new_device = True

    failed_burst = 0
    if attacker and random.random() < ATTACKER_FAILED_LOGIN_CHANCE:
        failed_burst = random.randint(*FAILED_LOGIN_BURST)
    elif not attacker and random.random() < LEGIT_FAILED_LOGIN_CHANCE:
        failed_burst = 1

    base_headers = {"Content-Type": "application/json"}
    if ip_header:
        base_headers["X-Forwarded-For"] = ip_header

    for _ in range(failed_burst):
        safe_post(
            session,
            LOGIN_URL,
            {
                "username": identity["username"],
                "password": f"wrong-{identity['password']}",
                "device": identity["device"],
            },
            base_headers,
        )

    login_status, login_data = safe_post(
        session,
        LOGIN_URL,
        {
            "username": identity["username"],
            "password": identity["password"],
            "device": identity["device"],
        },
        base_headers,
    )

    if login_status != 200:
        return {
            "identity_role": identity["role"],
            "attacker": attacker,
            "query": target_query,
            "status": -1,
            "login_status": login_status,
            "riskLevel": None,
            "maskLevel": None,
            "threatScore": None,
            "leaked_sensitive": False,
            "ip_spoofed": spoofed_ip,
            "new_device": new_device,
            "failed_login_burst": failed_burst,
            "error": login_data.get("error"),
        }

    token = login_data.get("token")
    if not token:
        return {
            "identity_role": identity["role"],
            "attacker": attacker,
            "query": target_query,
            "status": -1,
            "login_status": login_status,
            "riskLevel": None,
            "maskLevel": None,
            "threatScore": None,
            "leaked_sensitive": False,
            "ip_spoofed": spoofed_ip,
            "new_device": new_device,
            "failed_login_burst": failed_burst,
            "error": "Missing token in login response",
        }

    query_headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    if ip_header:
        query_headers["X-Forwarded-For"] = ip_header

    start = time.time()
    status, data = safe_post(
        session,
        QUERY_URL,
        {"query": target_query, "device": query_device},
        query_headers,
    )
    latency_ms = int((time.time() - start) * 1000)

    leaked = detect_leak(data) if status == 200 else False
    risk = data.get("risk", {}) if isinstance(data, dict) else {}

    return {
        "identity_role": identity["role"],
        "attacker": attacker,
        "query": target_query,
        "status": status,
        "login_status": login_status,
        "riskLevel": risk.get("riskLevel"),
        "maskLevel": risk.get("maskLevel"),
        "threatScore": risk.get("threatScore"),
        "leaked_sensitive": leaked,
        "ip_spoofed": spoofed_ip,
        "new_device": new_device,
        "failed_login_burst": failed_burst,
        "latency_ms": latency_ms,
        "error": data.get("error"),
    }


# ==============================================================
# EVALUATION
# ==============================================================

def evaluate_results(results: List[Dict]) -> None:
    attackers = [r for r in results if r["attacker"]]
    legit = [r for r in results if not r["attacker"]]

    attacker_success = sum(1 for r in attackers if r["leaked_sensitive"])
    false_positives = sum(1 for r in legit if r["leaked_sensitive"])

    attackers_flagged = sum(
        1
        for r in attackers
        if (r.get("riskLevel") in ("medium", "high"))
        or (r.get("maskLevel") in ("medium", "high"))
    )

    attacker_success_rate = (
        attacker_success / len(attackers) * 100 if attackers else 0
    )
    false_positive_rate = (
        false_positives / len(legit) * 100 if legit else 0
    )
    detection_rate = (
        attackers_flagged / len(attackers) * 100 if attackers else 0
    )

    print("==============================================")
    print(" CADDM Simulation Results")
    print("==============================================")
    print(f"Total requests: {len(results)}")
    print(f"Attacker requests: {len(attackers)}")
    print(f"Legitimate requests: {len(legit)}\n")

    print(f"Attacker successes (sensitive data leaked): {attacker_success}")
    print(f"Attacker success rate: {attacker_success_rate:.2f}%")
    print(f"False positives (legit leaked data): {false_positives}")
    print(f"False positive rate: {false_positive_rate:.2f}%")
    print(f"Attackers flagged (risk or masking): {attackers_flagged}")
    print(f"Detection rate: {detection_rate:.2f}%\n")

    print("Per-role breakdown:")
    for role in ROLES:
        subset = [r for r in results if r["identity_role"] == role]
        role_attackers = [r for r in subset if r["attacker"]]
        role_legit = [r for r in subset if not r["attacker"]]
        role_leaks = sum(1 for r in subset if r["leaked_sensitive"])
        role_attacker_leaks = sum(
            1 for r in role_attackers if r["leaked_sensitive"]
        )

        atk_rate = (
            role_attacker_leaks / len(role_attackers) * 100
            if role_attackers
            else 0
        )
        fp_rate = (
            sum(1 for r in role_legit if r["leaked_sensitive"])
            / len(role_legit)
            * 100
            if role_legit
            else 0
        )

        print(
            f"  Role={role}: total={len(subset)}, attackers={len(role_attackers)}, "
            f"leaks={role_leaks}, attacker_success%={atk_rate:.2f}%, FP%={fp_rate:.2f}%"
        )


# ==============================================================
# MAIN RUN + CSV EXPORT
# ==============================================================

def run():
    session = requests.Session()
    identities = generate_identities()
    for ident in identities:
        register_and_prime(session, ident)

    results = []
    for _ in range(N_REQUESTS):
        ident = random.choice(identities)
        results.append(simulate_request(session, ident))

    evaluate_results(results)

    fieldnames = sorted({k for r in results for k in r.keys()})
    with open("caddm_results.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in results:
            writer.writerow(r)

    print("\nSaved results to caddm_results.csv")


if __name__ == "__main__":
    run()
