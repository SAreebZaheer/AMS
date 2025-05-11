from flask import Flask, render_template, request, jsonify
import psycopg2
from psycopg2 import pool
import os
from datetime import datetime

app = Flask(__name__)

# Database configuration
DB_CONFIG = {
    "host": "localhost",
    "database": "airport_db",
    "user": "postgres",
    "password": "admin",
    "port": "5432"
}

# Create connection pool
try:
    connection_pool = psycopg2.pool.SimpleConnectionPool(
        minconn=1,
        maxconn=10,
        **DB_CONFIG
    )
    print("Database connection pool created successfully")
except Exception as e:
    print("Error while connecting to PostgreSQL", e)

def get_db_connection():
    """Gets a connection from the pool."""
    try:
        return connection_pool.getconn()
    except Exception as e:
        print("Database connection error:", e)
        return None

def release_db_connection(conn):
    """Returns a connection to the pool."""
    if conn:
        connection_pool.putconn(conn)

@app.route('/')
def index():
    return render_template('index.html')

# --- Existing Routes (Keep these as they are) ---

@app.route('/flights')
def flights():
    connection = get_db_connection()
    if not connection:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = connection.cursor()
    try:
        cursor.execute("""
            SELECT f.FLIGHT_CODE, a.AL_NAME, f.SOURCE, f.DESTINATION,
                   f.ARRIVAL, f.DEPARTURE, f.STATUS, f.FLIGHTTYPE
            FROM FLIGHT f
            JOIN AIRLINE a ON f.AIRLINEID = a.AIRLINEID
            ORDER BY f.DEPARTURE
        """)
        flights = []
        for row in cursor:
            flights.append({
                "flight_code": row[0],
                "airline": row[1],
                "source": row[2],
                "destination": row[3],
                "arrival": row[4],
                "departure": row[5],
                "status": row[6],
                "flight_type": row[7]
            })
        return jsonify(flights)
    except Exception as e:
        print("Error fetching flights:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        release_db_connection(connection)

@app.route('/passengers')
def passengers():
    connection = get_db_connection()
    if not connection:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = connection.cursor()
    try:
        cursor.execute("""
            SELECT p1.PID, p2.FNAME, p2.LNAME, p2.PASSPORTNO, p2.AGE, p2.SEX,
                   p2.ADDRESS, p2.PHONE, p3.FLIGHT_CODE
            FROM PASSENGER1 p1
            JOIN PASSENGER2 p2 ON p1.PASSPORTNO = p2.PASSPORTNO
            LEFT JOIN PASSENGER3 p3 ON p1.PID = p3.PID -- Use LEFT JOIN in case a passenger is not assigned to a flight yet
            ORDER BY p2.LNAME
        """)
        passengers = []
        for row in cursor:
            passengers.append({
                "pid": row[0],
                "first_name": row[1],
                "last_name": row[2],
                "passport_no": row[3],
                "age": row[4],
                "sex": row[5],
                "address": row[6],
                "phone": row[7],
                "flight_code": row[8]
            })
        return jsonify(passengers)
    except Exception as e:
        print("Error fetching passengers:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        release_db_connection(connection)

@app.route('/employees')
def employees():
    connection = get_db_connection()
    if not connection:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = connection.cursor()
    try:
        cursor.execute("""
            SELECT e.SSN, e.FNAME, e.LNAME, e.JOBTYPE, e2.SALARY,
                   e.POSITION, e.AP_NAME, e.AGE, e.SEX
            FROM EMPLOYEE1 e
            JOIN EMPLOYEE2 e2 ON e.JOBTYPE = e2.JOBTYPE
            ORDER BY e.LNAME
        """)
        employees = []
        for row in cursor:
            employees.append({
                "ssn": row[0],
                "first_name": row[1],
                "last_name": row[2],
                "job_type": row[3],
                "salary": row[4],
                "position": row[5],
                "airport": row[6],
                "age": row[7],
                "sex": row[8]
            })
        return jsonify(employees)
    except Exception as e:
        print("Error fetching employees:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        release_db_connection(connection)


@app.route('/airports')
def airports():
    connection = get_db_connection()
    if not connection:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = connection.cursor()
    try:
        cursor.execute("""
            SELECT a.AP_NAME, a.STATE, a.COUNTRY, c.CNAME
            FROM AIRPORT a
            JOIN CITY c ON a.CNAME = c.CNAME
            ORDER BY a.AP_NAME
        """)
        airports = []
        for row in cursor:
            airports.append({
                "name": row[0],
                "state": row[1],
                "country": row[2],
                "city": row[3]
            })
        return jsonify(airports)
    except Exception as e:
        print("Error fetching airports:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        release_db_connection(connection)


@app.route('/tickets')
def tickets():
    connection = get_db_connection()
    if not connection:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = connection.cursor()
    try:
        cursor.execute("""
            SELECT 
                t1.TICKET_NUMBER, 
                t1.SOURCE, 
                t1.DESTINATION, 
                t1.DATE_OF_BOOKING,
                t1.DATE_OF_TRAVEL, 
                t1.CLASS, 
                t1.SEATNO, 
                t2.PRICE,
                p2.FNAME || ' ' || p2.LNAME as passenger_name,
                t1.DATE_OF_CANCELLATION
            FROM TICKET1 t1
            JOIN PASSENGER1 p1 ON t1.PID = p1.PID AND t1.PASSPORTNO = p1.PASSPORTNO
            JOIN PASSENGER2 p2 ON p1.PASSPORTNO = p2.PASSPORTNO
            LEFT JOIN TICKET2 t2 ON t1.DATE_OF_BOOKING = t2.DATE_OF_BOOKING
                           AND t1.SOURCE = t2.SOURCE
                           AND t1.DESTINATION = t2.DESTINATION
                           AND t1.CLASS = t2.CLASS
            ORDER BY t1.DATE_OF_BOOKING DESC
        """)
        tickets = []
        for row in cursor:
            tickets.append({
                "ticket_number": row[0],
                "source": row[1],
                "destination": row[2],
                "booking_date": row[3].strftime('%Y-%m-%d') if row[3] else None,
                "travel_date": row[4].strftime('%Y-%m-%d') if row[4] else None,
                "class": row[5],
                "seat_no": row[6],
                "price": row[7],
                "passenger_name": row[8],
                "status": "Cancelled" if row[9] else "Active"
            })
        return jsonify(tickets)
    except Exception as e:
        print("Error fetching tickets:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        release_db_connection(connection)

@app.route('/airlines')
def get_airlines():
    """Returns a list of airlines for dropdowns."""
    connection = get_db_connection()
    if not connection:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = connection.cursor()
    try:
        cursor.execute("SELECT AIRLINEID, AL_NAME FROM AIRLINE ORDER BY AL_NAME")
        airlines = []
        for row in cursor:
            airlines.append({
                "airlineid": row[0],
                "al_name": row[1]
            })
        return jsonify(airlines)
    except Exception as e:
        print("Error fetching airlines:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        release_db_connection(connection)

@app.route('/flights_list')
def get_flights_list():
    """Returns a simplified list of flights for dropdowns (e.g., for assigning passengers)."""
    connection = get_db_connection()
    if not connection:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = connection.cursor()
    try:
        cursor.execute("SELECT FLIGHT_CODE, SOURCE, DESTINATION FROM FLIGHT ORDER BY FLIGHT_CODE")
        flights = []
        for row in cursor:
            flights.append({
                "flight_code": row[0],
                "source": row[1],
                "destination": row[2]
            })
        return jsonify(flights)
    except Exception as e:
        print("Error fetching flights list:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        release_db_connection(connection)

@app.route('/add_passenger', methods=['POST'])
def add_passenger():
    connection = get_db_connection()
    if not connection:
        return jsonify({"success": False, "error": "Database connection failed"}), 500

    data = request.json
    print("Received Passenger Data:", data)

    # Basic validation
    required_fields = ['passport_no', 'fname', 'lname', 'address', 'phone', 'age', 'sex']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"success": False, "error": f"Missing required field: {field}"}), 400

    cursor = connection.cursor()
    try:
        # Start a transaction
        connection.autocommit = False

        # Find the next available PID. This assumes PID is managed manually or by a sequence.
        # A robust solution would use a sequence, but for this schema, finding the max and adding 1 works for simple cases.
        cursor.execute("SELECT MAX(PID) FROM PASSENGER1")
        max_pid = cursor.fetchone()[0]
        new_pid = (max_pid or 0) + 1 # Start from 1 if table is empty


        # Insert into PASSENGER1
        cursor.execute(
            "INSERT INTO PASSENGER1 (PID, PASSPORTNO) VALUES (%s, %s)",
            (new_pid, data['passport_no'])
        )

        # Insert into PASSENGER2
        cursor.execute(
            "INSERT INTO PASSENGER2 (PASSPORTNO, FNAME, M, LNAME, ADDRESS, PHONE, AGE, SEX) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (data['passport_no'], data['fname'], data['m'], data['lname'], data['address'], data['phone'], data['age'], data['sex'])
        )

        # Insert into PASSENGER3 if a flight is assigned
        if data.get('flight_code'):
             cursor.execute(
                "INSERT INTO PASSENGER3 (PID, FLIGHT_CODE) VALUES (%s, %s)",
                (new_pid, data['flight_code'])
            )


        connection.commit()
        return jsonify({"success": True, "pid": new_pid}), 201

    except psycopg2.errors.UniqueViolation:
        connection.rollback()
        return jsonify({"success": False, "error": f"Passenger with passport number {data['passport_no']} already exists."}), 409
    except psycopg2.errors.ForeignKeyViolation as e:
        connection.rollback()
        print("Foreign key violation:", e)
        return jsonify({"success": False, "error": f"Invalid data provided. Please check flight code or other references."}), 400
    except Exception as e:
        connection.rollback()
        print("Error adding passenger:", e)
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()
        release_db_connection(connection)


@app.route('/add_flight', methods=['POST'])
def add_flight():
    connection = get_db_connection()
    if not connection:
        return jsonify({"success": False, "error": "Database connection failed"}), 500

    data = request.json
    print("Received Flight Data:", data)

    # Basic validation
    required_fields = ['flight_code', 'airlineid', 'source', 'destination', 'departure', 'arrival', 'status', 'flighttype', 'no_of_stops']
    for field in required_fields:
        if not data.get(field) is not None: # Check for None explicitly as 0 is valid for no_of_stops
             if not data.get(field) == 0 and not data.get(field):
                return jsonify({"success": False, "error": f"Missing required field: {field}"}), 400


    cursor = connection.cursor()
    try:
        cursor.execute(
            "INSERT INTO FLIGHT (FLIGHT_CODE, SOURCE, DESTINATION, ARRIVAL, DEPARTURE, STATUS, DURATION, FLIGHTTYPE, LAYOVER_TIME, NO_OF_STOPS, AIRLINEID) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (data['flight_code'], data['source'], data['destination'], data['arrival'], data['departure'], data['status'], data['duration'], data['flighttype'], data['layover_time'], data['no_of_stops'], data['airlineid'])
        )
        connection.commit()
        return jsonify({"success": True}), 201

    except psycopg2.errors.UniqueViolation:
        connection.rollback()
        return jsonify({"success": False, "error": f"Flight with code {data['flight_code']} already exists."}), 409
    except psycopg2.errors.ForeignKeyViolation:
        connection.rollback()
        return jsonify({"success": False, "error": f"Invalid Airline ID provided."}), 400
    except Exception as e:
        connection.rollback()
        print("Error adding flight:", e)
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()
        release_db_connection(connection)


@app.route('/add_ticket', methods=['POST'])
def add_ticket():
    connection = get_db_connection()
    if not connection:
        return jsonify({"success": False, "error": "Database connection failed"}), 500

    data = request.json
    print("Received Ticket Data:", data)

    # Basic validation
    required_fields = ['ticket_number', 'passenger_passport_no', 'source', 'destination', 'date_of_booking', 'class']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"success": False, "error": f"Missing required field: {field}"}), 400

    cursor = connection.cursor()
    try:
        connection.autocommit = False

        # Find the PID for the given passport number
        cursor.execute("SELECT PID FROM PASSENGER1 WHERE PASSPORTNO = %s", (data['passenger_passport_no'],))
        passenger_row = cursor.fetchone()
        if not passenger_row:
            connection.rollback()
            return jsonify({"success": False, "error": f"Passenger with passport number {data['passenger_passport_no']} not found."}), 404
        passenger_pid = passenger_row[0]

        # Insert into TICKET1
        cursor.execute(
            "INSERT INTO TICKET1 (TICKET_NUMBER, SOURCE, DESTINATION, DATE_OF_BOOKING, DATE_OF_TRAVEL, SEATNO, CLASS, DATE_OF_CANCELLATION, PID, PASSPORTNO) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (data['ticket_number'], 
             data['source'], 
             data['destination'], 
             data['date_of_booking'],
             data.get('date_of_travel'), 
             data.get('seatno'), 
             data['class'], 
             None, 
             passenger_pid, 
             data['passenger_passport_no'])
        )

        # Create a corresponding TICKET2 entry with a default price
        default_price = {
            'ECONOMY': 50000,
            'BUSINESS': 150000,
            'FIRST-CLASS': 250000
        }.get(data['class'], 50000)

        try:
            cursor.execute(
                "INSERT INTO TICKET2 (DATE_OF_BOOKING, SOURCE, DESTINATION, CLASS, PRICE) VALUES (%s, %s, %s, %s, %s)",
                (data['date_of_booking'], data['source'], data['destination'], data['class'], default_price)
            )
        except psycopg2.errors.UniqueViolation:
            # Ticket2 entry already exists, which is fine
            connection.rollback()
            connection.autocommit = False
            pass

        connection.commit()
        return jsonify({"success": True}), 201

    except psycopg2.errors.UniqueViolation:
        connection.rollback()
        return jsonify({"success": False, "error": f"Ticket with number {data['ticket_number']} already exists."}), 409
    except psycopg2.errors.ForeignKeyViolation as e:
        connection.rollback()
        print("Foreign key violation:", e)
        return jsonify({"success": False, "error": f"Invalid Passenger or other reference provided."}), 400
    except Exception as e:
        connection.rollback()
        print("Error adding ticket:", e)
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()
        release_db_connection(connection)


@app.route('/add_airline', methods=['POST'])
def add_airline():
    connection = get_db_connection()
    if not connection:
        return jsonify({"success": False, "error": "Database connection failed"}), 500

    data = request.json
    print("Received Airline Data:", data)

    # Basic validation
    required_fields = ['airlineid', 'al_name']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"success": False, "error": f"Missing required field: {field}"}), 400

    cursor = connection.cursor()
    try:
        cursor.execute(
            "INSERT INTO AIRLINE (AIRLINEID, AL_NAME, THREE_DIGIT_CODE) VALUES (%s, %s, %s)",
            (data['airlineid'], data['al_name'], data['three_digit_code'])
        )
        connection.commit()
        return jsonify({"success": True}), 201

    except psycopg2.errors.UniqueViolation:
        connection.rollback()
        return jsonify({"success": False, "error": f"Airline with ID {data['airlineid']} already exists."}), 409
    except Exception as e:
        connection.rollback()
        print("Error adding airline:", e)
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()
        release_db_connection(connection)
        

@app.route('/delete_passenger/<passport_no>', methods=['DELETE'])
def delete_passenger(passport_no):
    connection = get_db_connection()
    if not connection:
        return jsonify({"success": False, "error": "Database connection failed"}), 500

    cursor = connection.cursor()
    try:
        # Start transaction
        connection.autocommit = False
        
        # First delete from PASSENGER3 (if exists)
        cursor.execute("DELETE FROM PASSENGER3 WHERE PID IN (SELECT PID FROM PASSENGER1 WHERE PASSPORTNO = %s)", (passport_no,))
        
        # Then delete from PASSENGER1 (which will cascade to PASSENGER2)
        cursor.execute("DELETE FROM PASSENGER1 WHERE PASSPORTNO = %s", (passport_no,))
        
        connection.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        connection.rollback()
        print("Error deleting passenger:", e)
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()
        release_db_connection(connection)

@app.route('/delete_flight/<flight_code>', methods=['DELETE'])
def delete_flight(flight_code):
    connection = get_db_connection()
    if not connection:
        return jsonify({"success": False, "error": "Database connection failed"}), 500

    cursor = connection.cursor()
    try:
        cursor.execute("DELETE FROM FLIGHT WHERE FLIGHT_CODE = %s", (flight_code,))
        connection.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        connection.rollback()
        print("Error deleting flight:", e)
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()
        release_db_connection(connection)

@app.route('/delete_ticket/<ticket_number>', methods=['DELETE'])
def delete_ticket(ticket_number):
    connection = get_db_connection()
    if not connection:
        return jsonify({"success": False, "error": "Database connection failed"}), 500

    cursor = connection.cursor()
    try:
        cursor.execute("DELETE FROM TICKET1 WHERE TICKET_NUMBER = %s", (ticket_number,))
        connection.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        connection.rollback()
        print("Error deleting ticket:", e)
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()
        release_db_connection(connection)

@app.route('/delete_airline/<airlineid>', methods=['DELETE'])
def delete_airline(airlineid):
    connection = get_db_connection()
    if not connection:
        return jsonify({"success": False, "error": "Database connection failed"}), 500

    cursor = connection.cursor()
    try:
        cursor.execute("DELETE FROM AIRLINE WHERE AIRLINEID = %s", (airlineid,))
        connection.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        connection.rollback()
        print("Error deleting airline:", e)
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()
        release_db_connection(connection)


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')