# generates a user key, access level, and stores in users database.
# when key is generated, grab IP address and store in database with user attributes
# TODO: check if user already exists in database

import json
import datetime as dt


class User:
    '''Class to encapsulate user data attributes
    Attributes:
        user_id (str): Unique identifier for the user
        access_level (str): Access level of the user
        ip_address (str): IP address of the user
        user_key (str): Generated user key
        time_stamp (str): Timestamp of key generation / access
        '''

    def __init__(self, user_id, access_level):
        self._user_id = user_id
        self._access_level = access_level
        self._ip_address = '' # Placeholder for IP address
        self._user_key = '' # Placeholder for generated user key
        self._time_stamp = '' # Placeholder for timestamp
    
    # properties
    @property
    def user_id(self):
        return self._user_id

    @user_id.setter
    def user_id(self, value):
        self._user_id = value

    @property
    def access_level(self):
        return self._access_level

    @access_level.setter
    def access_level(self, value):
        self._access_level = value

    @property
    def ip_address(self):
        return self._ip_address

    @ip_address.setter
    def ip_address(self, value):
        self._ip_address = value

    @property
    def user_key(self):
        return self._user_key

    @user_key.setter
    def user_key(self, value):
        self._user_key = value

    @property
    def time_stamp(self):
        return self._time_stamp

    @time_stamp.setter
    def time_stamp(self, value):
        self._time_stamp = value

    # methods to generate user key, get IP address, get timestamp
    def get_ip_address(self):
        '''Method to retrieve the user's IP address'''
        # Placeholder implementation - in real code, would retrieve actual IP
        self.ip_address = ""
    
    def get_timestamp(self):
        '''Method to retrieve the current timestamp'''
        # Placeholder implementation - in real code, would retrieve actual timestamp
        self.time_stamp = dt.datetime.now().isoformat()
        self.time_stamp = self.time_stamp.split('.')[0] + 'Z'  # Format to remove microseconds and add 'Z'

    def generate_user_key(self):
        '''Method to generate a user key based on user_id and access_level'''
        # Placeholder implementation - in real code, would use a secure method to generate key
        self.user_key = f"KEY-{self.user_id}-{self.access_level}"

    
    # convert to JSON for export
    def to_json(self):
        '''Convert user data to JSON format'''
        return json.dumps({
            "user_id": self.user_id,
            "access_level": self.access_level,
            "ip_address": self.ip_address,
            "user_key": self.user_key,
            "timestamp": self.time_stamp
        }, indent=4)



# user object is created with user_id
user = User("12345", "admin")

print(user.to_json())











# # # example of generating JSON output for user key and attributes
# # import json

# # data to be included in JSON output (one output for user, one for admin)
# user_id = "USER_ID_PLACEHOLDER"
# access_level = "ACCESS_LEVEL_PLACEHOLDER"
# ip_address = "IP_ADDRESS_PLACEHOLDER"
# user_key = "GENERATED_USER_KEY_PLACEHOLDER"
# time_stamp = "TIMESTAMP_PLACEHOLDER"

# # create a dictionary to hold the data, to be converted to JSON
# user_data = {
#     "user_id": f"{user_id}",
#     "access_level": f"{access_level}",
#     "ip_address": f"{ip_address}",
#     "user_key": f"{user_key}",
#     "timestamp": f"{time_stamp}"
# }

# # convert dictionary to JSON string (export to file)
# json_output = json.dumps(
#     {"user_id": user_data['user_id'], "user_key": user_data['user_key']}, 
#     indent=4
# )

# print(json_output)

# with open('user_key.json', 'w') as json_file:
#     json_file.write(json_output)

