# Context-Aware Dynamic Data Masking for Cloud Databases:
A cloud-deployed MySQL system with dynamic data masking, secure file-based key management, and context based encryption.

## Use Case:
Employee accessess database on a non-secure / unknown IP address / at 3AM. Data is dynamically encrypted based on potential 'threat level' (and set RBAC).


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

