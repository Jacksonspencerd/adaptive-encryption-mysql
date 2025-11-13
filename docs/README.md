# Context-Aware Dynamic Data Masking for Cloud Databases:
A cloud-deployed MySQL system with dynamic data masking, secure file-based key management, and context based encryption.

## Use Case:
Employee accessess database on a non-secure / unknown IP address / at 3AM. Data is dynamically encrypted based on potential 'threat level' (and set RBAC).

## To-Do
- [ ] Put on cloudlab
- [ ] write out instructions for registration and use
- [ ] risk score not updating visually -> admin has 0.1, user has 0

## Users Database Requirements:
```
ip_address
normal_access_window
user_id
user_key
access_level
```

## Mock Database Example:
```
id
first_name
last_name
ssn
race
gender
email
phone
department
job_title
salary
```

