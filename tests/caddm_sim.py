import requests
import jwt
import random
import csv
import time

# ==============================================================
# CONFIGURATION
# ==============================================================

API_URL = "http://localhost:3000/api/query"
JWT_SECRET = "supersecret_dev_key"   # must match backend
N_REQUESTS = 5000                    # large run for tuning
ATTACKER_RATE = 0.10                 # 10% of identities are attackers

# Industry realistic anomaly probabilities
LEGIT_ANOMALY = {
    "hour": 0.10,
    "ip": 0.08,
    "device": 0.12,
    "failed": 0.05
}

ATTACKER_BOOST = {
    "hour": 0.40,
    "ip": 0.35,
    "device": 0.45,
    "failed": 0.50
}

# Admin stealth factor: % of admin attackers who appear normal
ADMIN_STEALTH_CHANCE = 0.35


# ==============================================================
# IDENTITY GENERATION
# ==============================================================

ROLES = ["user", "analyst", "admin"]

def generate_identities(n=50):
    identities = []

    for i in range(n):
        attacker = random.random() < ATTACKER_RATE
        role = random.choice(ROLES)

        identities.append({
            "username": f"user{i}",
            "role": role,
            "attacker": attacker,
        })
    return identities


# ==============================================================
# GENERATE JWT
# ==============================================================

def make_jwt(identity):
    payload = {
        "id": identity["username"],
        "role": identity["role"],
        "iat": int(time.time())
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


# ==============================================================
# QUERY SELECTION
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
    "SELECT * FROM employee_table"
]

def choose_query(attacker):
    if attacker:
        # ~70% chance attacker probes sensitive data
        if random.random() < 0.7:
            return random.choice(SENSITIVE_QUERIES)
    return random.choice(SAFE_QUERIES)


# ==============================================================
# ANOMALY SIMULATION
# ==============================================================

def generate_anomaly_vector(identity):
    role = identity["role"]
    attacker = identity["attacker"]

    # Legitimate baseline anomalies
    hour = random.random() < LEGIT_ANOMALY["hour"]
    ip = random.random() < LEGIT_ANOMALY["ip"]
    device = random.random() < LEGIT_ANOMALY["device"]
    failed = random.random() < LEGIT_ANOMALY["failed"]

    if attacker:
        # Attackers boost anomalies
        if random.random() < ATTACKER_BOOST["hour"]:
            hour = True
        if random.random() < ATTACKER_BOOST["ip"]:
            ip = True
        if random.random() < ATTACKER_BOOST["device"]:
            device = True
        if random.random() < ATTACKER_BOOST["failed"]:
            failed = True

        # Admin attackers sometimes look perfectly normal
        if role == "admin" and random.random() < ADMIN_STEALTH_CHANCE:
            hour = ip = device = failed = False

    return {
        "hour": hour,
        "ip": ip,
        "device": device,
        "failed": failed
    }


# ==============================================================
# SIMULATED REQUEST
# ==============================================================

def simulate_request(identity):
    token = make_jwt(identity)
    attacker = identity["attacker"]
    role = identity["role"]

    query = choose_query(attacker)
    anomalies = generate_anomaly_vector(identity)

    # Convert anomalies into fake device payload expected by CADDM
    device_payload = {
        "os": "Windows" if not anomalies["device"] else f"Windows-{random.randint(1000,9999)}",
        "browser": "Chrome",
        "version": "119"
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    payload = {
        "query": query,
        "device": device_payload
    }

    try:
        # print("Sending headers:", headers)

        resp = requests.post(API_URL, json=payload, headers=headers)
        data = resp.json()

        # Detect “leaked sensitive data” = presence of unmasked fields
        leaked = False
        if "rows" in data and data["rows"]:
            row = data["rows"][0]
            for col in ["ssn", "salary", "race", "gender", "email", "phone"]:
                if col in row and row[col] not in ("REDACTED", "******", None):
                    leaked = True

        return {
            "identity_role": role,
            "attacker": attacker,
            "query": query,
            "status": resp.status_code,
            "riskLevel": data.get("risk", {}).get("riskLevel"),
            "maskLevel": data.get("risk", {}).get("maskLevel"),
            "threatScore": data.get("risk", {}).get("threatScore"),
            "leaked_sensitive": leaked,
        }

    except Exception as e:
        return {
            "identity_role": role,
            "attacker": attacker,
            "query": query,
            "status": -1,
            "riskLevel": None,
            "maskLevel": None,
            "threatScore": None,
            "leaked_sensitive": False,
            "error": str(e)
        }


# ==============================================================
# EVALUATION
# ==============================================================

def evaluate_results(results):
    attackers = [r for r in results if r["attacker"]]
    legit = [r for r in results if not r["attacker"]]

    attacker_success = sum(1 for r in attackers if r["leaked_sensitive"])
    false_positives = sum(1 for r in legit if r["leaked_sensitive"])

    # --- Percentage calculations ---
    attacker_success_rate = (attacker_success / len(attackers) * 100) if attackers else 0
    false_positive_rate = (false_positives / len(legit) * 100) if legit else 0

    print("==============================================")
    print(" CADDM Simulation Results")
    print("==============================================")
    print(f"Total requests: {len(results)}")
    print(f"Attacker requests: {len(attackers)}")
    print(f"Legitimate requests: {len(legit)}\n")

    print(f"Attacker successes (sensitive data leaked): {attacker_success}")
    print(f"Attacker success rate: {attacker_success_rate:.2f}%")
    print(f"False positives (legit leaked data): {false_positives}")
    print(f"False positive rate: {false_positive_rate:.2f}%\n")

    print("Per-role breakdown:")
    for role in ROLES:
        subset = [r for r in results if r["identity_role"] == role]
        role_attackers = [r for r in subset if r["attacker"]]
        role_legit = [r for r in subset if not r["attacker"]]
        role_leaks = sum(1 for r in subset if r["leaked_sensitive"])
        role_attacker_leaks = sum(1 for r in role_attackers if r["leaked_sensitive"])

        atk_rate = (role_attacker_leaks / len(role_attackers) * 100) if role_attackers else 0
        fp_rate = (sum(1 for r in role_legit if r["leaked_sensitive"]) / len(role_legit) * 100) if role_legit else 0

        print(f"  Role={role}: total={len(subset)}, attackers={len(role_attackers)}, "
              f"leaks={role_leaks}, attacker_success%={atk_rate:.2f}%, FP%={fp_rate:.2f}%")


# ==============================================================
# MAIN — RUN + CSV EXPORT
# ==============================================================

def run():
    identities = generate_identities(50)
    results = []

    for _ in range(N_REQUESTS):
        ident = random.choice(identities)
        result = simulate_request(ident)
        results.append(result)

    evaluate_results(results)

    # CSV saving
    fieldnames = sorted({k for r in results for k in r.keys()})
    with open("caddm_results.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in results:
            writer.writerow(r)

    print("\nSaved results to caddm_results.csv")


if __name__ == "__main__":
    run()
