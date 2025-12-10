# Context-Aware Dynamic Data Masking for Cloud Databases:
A cloud-deployed MySQL system with dynamic data masking and context based encryption.

## Use Case:
Employee accessess database on a non-secure / unknown IP address / at 3AM. Data is dynamically encrypted based on potential 'threat level' (and set RBAC).

## Setup:

run ```npm install``` in both the backend and frontend folders

ensure database configs are set in backend ```backend\.env``` file

in Xampp or mysql, import / run ```backend/data/CADDM_DB.sql```

Once the DB is live, and required node_modules are installed in both frontend and backend, run ```npm start``` in a frontend terminal and a backend terminal

you should then be able to see the frontend in any chrome based browser, the link should be output in the terminal. 

As there is no register page you are required to register through a manual POST request. 

Specifications are below in the User Registration write up. 

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
