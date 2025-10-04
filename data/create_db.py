# file to create the database if it doesn't exist
# https://www.w3schools.com/python/python_mysql_create_db.asp

import mysql.connector
from mysql.connector import errorcode
from logger import setup_logger
import sys
import os

# Set up logger for this script
logger = setup_logger('create_db', 'create_db.log')

# Name of the database to create/use
DB_NAME = 'adaptive_encryption'

# Establish a connection to MySQL using environment variables or defaults
DB_NAME = mysql.connector.connect(
    host=os.getenv('DB_HOST', 'localhost'),
    user=os.getenv('DB_USER', 'root'),
    password=os.getenv('DB_PASSWORD', ''),
    database=os.getenv('DB_NAME', 'adaptive_encryption')
).database

# Get a cursor object to execute SQL queries
mycursor = DB_NAME.cursor()

def create_database(cursor):
    """
    Create the database if it does not exist.
    """
    try:
        cursor.execute(
            f"CREATE DATABASE {DB_NAME} DEFAULT CHARACTER SET 'utf8'")
    except mysql.connector.Error as err:
        logger.error(f"Failed creating database: {err}")
        sys.exit(1)
    logger.info(f"Database {DB_NAME} created successfully.")

def use_database(cursor):
    """
    Try to use the database, create it if it does not exist.
    """
    try:
        cursor.execute(f"USE {DB_NAME}")
    except mysql.connector.Error as err:
        logger.error(f"Database {DB_NAME} does not exist.")
        if err.errno == errorcode.ER_BAD_DB_ERROR:
            create_database(cursor)
            logger.info(f"Database {DB_NAME} created successfully.")
            cursor.execute(f"USE {DB_NAME}")
        else:
            logger.error(err)
            sys.exit(1)

def drop_database(cursor):
    """
    Drop the database.
    """
    try:
        cursor.execute(f"DROP DATABASE {DB_NAME}")
        logger.info(f"Database {DB_NAME} dropped successfully.")
    except mysql.connector.Error as err:
        logger.error(f"Failed dropping database: {err}")
        sys.exit(1)
    

def main():
    """
    Main function to create and use the database.
    """
    create_database(mycursor)
    use_database(mycursor)
    logger.info(f"Using database {DB_NAME}.")

if __name__ == "__main__":
    main()