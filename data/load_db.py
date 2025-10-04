# script to create table and fill the database with dummy data 
import mysql.connector
from logger import setup_logger
import os
import sys
import random
import string
from datetime import datetime, timedelta
from mysql.connector import errorcode
import csv

# Set up logger for this script
logger = setup_logger('load_db', 'load_db.log')
DB_NAME = 'adaptive_encryption'
# Establish a connection to MySQL using environment variables or defaults
db_connection = mysql.connector.connect(
    host=os.getenv('DB_HOST', 'localhost'),
    user=os.getenv('DB_USER', 'root'),
    password=os.getenv('DB_PASSWORD', ''),
    database=os.getenv('DB_NAME', 'adaptive_encryption')
)
cursor = db_connection.cursor()
def create_table(cursor = cursor):
    """
    Load dummy data into the database.
    """
    try:
        # Create table if it doesn't exist
        cursor.execute(f"""
            CREATE or ALTER TABLE employees (
            id INT PRIMARY KEY,
            first_name VARCHAR(50),
            last_name VARCHAR(50),
            ssn VARCHAR(20),
            race VARCHAR(50),
            gender VARCHAR(20),
            email VARCHAR(100),
            phone VARCHAR(20),
            department VARCHAR(50),
            job_title VARCHAR(100),
            salary BIGINT(10,2)
        );
        """)
        logger.info("Table 'employees' ensured to exist.")
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_TABLE_EXISTS_ERROR:
            logger.info("Table 'employees' already exists.")
        else:
            logger.error(f"Error creating table: {err}")
            sys.exit(1)
    
def load_csv_data(file_path, cursor = cursor):
    """
    Load dummy data into the database from a CSV file.
    """
    try:
        with open("data/MOCK_DATA.csv", "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cursor.execute("""
                INSERT INTO employees 
                (id, first_name, last_name, ssn, race, gender, email, phone, department, job_title, salary)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                row["id"], row["first"], row["last"], row["ssn"], row["race"],
                row["gender"], row["email"], row["phone"], row["department"],
                row["job title"], row["salary"]
            ))
        logger.info("Dummy data loaded successfully from CSV.")
    except mysql.connector.Error as err:
        logger.error(f"Error loading data: {err}")
        sys.exit(1)
    except FileNotFoundError as fnf_error:
        logger.error(f"File not found: {fnf_error}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"An error occurred: {e}")
        sys.exit(1)
# Create table and load data
create_table(cursor)
load_csv_data("data/MOCK_DATA.csv", cursor)


# Commit changes and close the connection
conn.commit()
cursor.close()
conn.close()

