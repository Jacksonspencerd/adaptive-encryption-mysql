# Context-Aware Dynamic Data Masking for Cloud Databases:
A cloud-deployed MySQL system with dynamic data masking, secure file-based key management, and context based encryption.

## Use Case:
Employee accessess database on a non-secure / unknown IP address / at 3AM. Data is dynamically encrypted based on potential 'threat level' (and set RBAC).

## To-Do
- [ ] Put on cloudlab
- [ ] write out instructions for registration and use
- [ ] risk score not updating visually -> admin has 0.1, user has 0

### User Registration
POST /api/auth/register

Content-Type application/json

ex:
{
    "username" : 'username',
    "password" : 'password',
    "role" : 'role' || guest is default
}

## Users Database Requirements:
```
id
username
pass_hash
role
created_at
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

