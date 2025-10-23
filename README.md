# Context-Aware Dynamic Data Masking for Cloud Databases:
A cloud-deployed MySQL system with dynamic data masking, secure file-based key management, and context based encryption.

## Use Case:
Employee accessess database on a non-secure / unknown IP address / at 3AM. Data is dynamically encrypted based on potential 'threat level' (and set RBAC).

## generated file system:
```perl
my-cloudlab-project/
│
├── package.json                 # Node.js dependencies and scripts
├── package-lock.json
├── README.md                    # Project description, setup instructions
├── .env                         # Environment variables (DB credentials, secrets)
├── server.js                    # Main entry point for the Express server
│
├── config/                      # Configuration files
│   ├── db.js                    # MySQL connection config
│   └── threatConfig.js          # Threat scoring weights and thresholds
│
├── controllers/                 # Express route handlers
│   ├── authController.js        # Login, session, threat score
│   └── queryController.js       # Query execution, masking logic
│
├── middleware/                  # Middleware functions
│   ├── authMiddleware.js        # Session/token validation
│   ├── threatMiddleware.js      # Compute threat score
│   └── maskMiddleware.js        # Mask query results based on role + threat
│
├── models/                      # Database interaction
│   ├── userModel.js             # authdb queries (users, logins)
│   └── dataModel.js             # mockdata queries (SELECT only)
│
├── routes/                      # API routes
│   ├── authRoutes.js            # /login route
│   └── queryRoutes.js           # /query route
│
├── public/                      # Static frontend files
│   ├── index.html               # Login page / main UI
│   ├── dashboard.html           # Query page with table display
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── login.js             # Handles login form submission
│       └── query.js             # Handles query submission & table rendering
│
├── utils/                       # Helper functions
│   ├── sqlValidator.js          # Ensures queries are SELECT only
│   ├── maskUtils.js             # Functions for column masking
│   └── logger.js                # Optional query/login logging
├── data/                     # **New folder for seed data**
│   └── mockdata.json         # Your static mock data
│
├── scripts/                  # **New folder for DB setup scripts**
│   └── seedMockData.js       # Reads mockdata.json and inserts into MySQL
│
└── logs/                        # Optional: log files for queries and login attempts
    └── app.log
```
Notes on this Structure

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
- [ ] key generator (handled in User Class)
- [ ] key verifier 
- [ ] UserDB
- [ ] Mock DB
- [ ] risk scoring module  
    -> four threat levels: low (0-25), medium (26-50), high (51-75), critical (76-100)
- [ ] masking engine:  
    -> mysql has column-level masking so we need to trigger that with python depending on request threat level
- [ ] Need to store metadata of what columns will be blacked out for what access levels

## Uers Database Requirements:
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

