# Context-Aware Dynamic Data Masking for Cloud Databases:
A cloud-deployed MySQL system with dynamic data masking and context based encryption.

## Use Case:
Employee accessess database on a non-secure / unknown IP address / at 3AM. Data is dynamically encrypted based on potential 'threat level' (and set RBAC).

## Setup:

run ```npm install``` in both the backend and frontend folders

ensure database configs are set in backend ```backend\.env``` file

in Xampp or mysql, import / run ```backend/data/CADDM_DB.sql```

### User Registration
POST /api/auth/register

Headers:
Content-Type application/json

ex:
```
{
    "username" : 'username',
    "password" : 'password',
    "role" : 'role' # guest is default
}
```
