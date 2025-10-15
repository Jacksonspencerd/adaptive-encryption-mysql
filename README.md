# Context-Aware Dynamic Data Masking for Cloud Databases:
A cloud-deployed MySQL system with dynamic data masking, secure file-based key management, and context based encryption.

## Use Case:
Employee accessess database on a non-secure / unknown IP address / at 3AM. Data is dynamically encrypted based on potential 'threat level'.


## To-Do
- [ ] key generator  
- [ ] key verifier  
- [ ] risk scoring module  
    -> four threat levels: (green, yellow, orange, red)  
- [ ] masking engine:  
    -> mysql has column-level masking so we need to trigger that with python depending on request threat level  

## Internal Database Requirements:
```
ip_address
normal_access_window
username
pass_key
access_level
```

## External Database Example:
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
