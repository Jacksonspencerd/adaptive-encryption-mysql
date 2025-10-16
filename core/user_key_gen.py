# generates a user key, access level, and stores in users database.
# when key is generated, grab IP address and store in database with user attributes

import json

user_id = "USER_ID_PLACEHOLDER"
access_level = "ACCESS_LEVEL_PLACEHOLDER"
ip_address = "IP_ADDRESS_PLACEHOLDER"
user_key = "GENERATED_USER_KEY_PLACEHOLDER"
time_stamp = "TIMESTAMP_PLACEHOLDER"




data = {
    "user_id": f"{user_id}",
    "access_level": f"{access_level}",
    "ip_address": f"{ip_address}",
    "user_key": f"{user_key}",
    "timestamp": f"{time_stamp}"
}

json_output = json.dumps(data, indent=4)
print(json_output)