# Context-Aware Dynamic Data Masking for Cloud Databases:
A cloud-deployed MySQL system with dynamic data masking, secure file-based key management, and context based encryption.

## Use Case:
Employee accessess database on a non-secure / unknown IP address / at 3AM. Data is dynamically encrypted based on potential 'threat level' (and set RBAC).

## generated file system:
```perl
my-ddm-project/
│
├── backend/                        # Node.js / Express API
│   ├── package.json
│   ├── server.js                   # Entry point
│   ├── .env                        # DB creds, JWT secret
│   │
│   ├── config/
│   │   └── db.js                   # MariaDB connection pool
│   │
│   ├── controllers/
│   │   └── queryController.js      # Handles /query requests
│   │
│   ├── middleware/
│   │   └── maskMiddleware.js       # Applies masking to rows
│   │
│   ├── routes/
│   │   └── queryRoutes.js          # Express routes (/query)
│   │
│   ├── utils/
│   │   ├── sqlValidator.js         # Only allow SELECT queries
│   │   └── maskUtils.js            # Masking functions
│   │
│   └── logs/
│       └── app.log                 # Query logs (optional)
│
└── frontend/                       # React app
    ├── package.json
    ├── public/
    │   └── index.html
    │
    └── src/
        ├── App.js                  # Main component
        ├── components/
        │   ├── QueryInput.js       # Text box + submit
        │   └── ResultsTable.js     # Table for displaying results
        │
        └── index.js                # React entry point

```
### Notes on this Structure

Separation of Concerns
- controllers handle logic

- routes define API endpoints

- models handle database queries

- middleware handles cross-cutting concerns (auth, masking, threat scoring)

Frontend

- Small, static files served from public/

- login.js sends credentials via fetch to /login

- query.js sends SQL to /query and renders results in a table

Security / Config

- .env stores DB username/password, session secret

- config/db.js reads .env and exports a MySQL connection pool

Scalability

- You can add additional middleware or features easily

- Masking logic is modular in maskMiddleware.js and maskUtils.js

Logging / Auditing

- logs/app.log can store timestamped login attempts and query executions


## To-Do
- [ ] everything fam
- [ ] can add mock data to mysql database using phpMyAdmin (hosted in cloud_lab)

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

