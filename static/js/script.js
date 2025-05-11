document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const addDataModalElement = document.getElementById('addDataModal');
    const addDataModal = new bootstrap.Modal(addDataModalElement);

    const addTypeSelection = document.getElementById('add-type-selection');
    const passengerFormDiv = document.getElementById('add-passenger-form');
    const flightFormDiv = document.getElementById('add-flight-form');
    const ticketFormDiv = document.getElementById('add-ticket-form');
    const airlineFormDiv = document.getElementById('add-airline-form');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');

            contentSections.forEach(section => {
                section.style.display = 'none';
            });

            document.getElementById(sectionId).style.display = 'block';

            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            this.classList.add('active');

            if (sectionId === 'flights') {
                loadFlights();
            } else if (sectionId === 'passengers') {
                loadPassengers();
            } else if (sectionId === 'employees') {
                loadEmployees();
            } else if (sectionId === 'airports') {
                loadAirports();
            } else if (sectionId === 'tickets') {
                loadTickets();
            }
        });
    });

    document.getElementById('add-fab')?.addEventListener('click', function() {
        resetAddModal();
        addDataModal.show();
    });

    document.querySelectorAll('#add-type-selection .list-group-item').forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            addTypeSelection.style.display = 'none';
            if (type === 'passenger') {
                passengerFormDiv.style.display = 'block';
                populateFlightDropdown('#passengerFlightCode');
            } else if (type === 'flight') {
                flightFormDiv.style.display = 'block';
                populateAirlineDropdown('#flightAirline');
            } else if (type === 'ticket') {
                ticketFormDiv.style.display = 'block';
                populatePassengerDropdown('#ticketPassenger');
            } else if (type === 'airline') {
                airlineFormDiv.style.display = 'block';
            }
        });
    });

    document.querySelectorAll('.modal-body .cancel-add').forEach(button => {
        button.addEventListener('click', function() {
            resetAddModal();
            addDataModal.hide();
        });
    });

    document.getElementById('passengerForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const passengerData = {
            passport_no: document.getElementById('passengerPassportNo').value.trim(),
            fname: document.getElementById('passengerFName').value.trim(),
            m: document.getElementById('passengerM').value.trim() || null,
            lname: document.getElementById('passengerLName').value.trim(),
            address: document.getElementById('passengerAddress').value.trim(),
            phone: document.getElementById('passengerPhone').value,
            age: parseInt(document.getElementById('passengerAge').value),
            sex: document.getElementById('passengerSex').value.trim().toUpperCase(),
            flight_code: document.getElementById('passengerFlightCode').value.trim() || null
        };

        if (!passengerData.passport_no || !passengerData.fname || !passengerData.lname || !passengerData.address || !passengerData.phone || isNaN(passengerData.age) || !['M','F'].includes(passengerData.sex)) {
            alert("Please fill in all required fields correctly.");
            return;
        }

        console.log("Adding Passenger:", passengerData);
        sendData('/add_passenger', passengerData, 'Passenger');
    });

    document.getElementById('flightForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const flightData = {
            flight_code: document.getElementById('flightCode').value.trim(),
            airlineid: document.getElementById('flightAirline').value,
            source: document.getElementById('flightSource').value.trim().toUpperCase(),
            destination: document.getElementById('flightDestination').value.trim().toUpperCase(),
            departure: document.getElementById('flightDeparture').value.trim(),
            arrival: document.getElementById('flightArrival').value.trim(),
            status: document.getElementById('flightStatus').value,
            duration: document.getElementById('flightDuration').value.trim() || null,
            flighttype: document.getElementById('flightType').value,
            layover_time: document.getElementById('flightLayoverTime').value.trim() || null,
            no_of_stops: parseInt(document.getElementById('flightNoOfStops').value)
        };

        if (!flightData.flight_code || !flightData.airlineid || !flightData.source || !flightData.destination || !flightData.departure || !flightData.arrival || !flightData.status || !flightData.flighttype || isNaN(flightData.no_of_stops)) {
            alert("Please fill in all required fields correctly.");
            return;
        }

        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(flightData.departure) || !timeRegex.test(flightData.arrival)) {
            alert("Please use HH:MM format for Departure and Arrival times.");
            return;
        }

        console.log("Adding Flight:", flightData);
        sendData('/add_flight', flightData, 'Flight');
    });

    document.getElementById('ticketForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const ticketData = {
            ticket_number: document.getElementById('ticketNumber').value,
            passenger_passport_no: document.getElementById('ticketPassenger').value,
            source: document.getElementById('ticketSource').value.trim().toUpperCase(),
            destination: document.getElementById('ticketDestination').value.trim().toUpperCase(),
            date_of_booking: document.getElementById('ticketBookingDate').value,
            date_of_travel: document.getElementById('ticketTravelDate').value || null,
            seatno: document.getElementById('ticketSeatNo').value.trim() || null,
            class: document.getElementById('ticketClass').value
        };

        if (!ticketData.ticket_number || !ticketData.passenger_passport_no || !ticketData.source || !ticketData.destination || !ticketData.date_of_booking || !ticketData.class) {
            alert("Please fill in all required fields correctly.");
            return;
        }

        console.log("Adding Ticket:", ticketData);
        sendData('/add_ticket', ticketData, 'Ticket');
    });

    document.getElementById('airlineForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const airlineData = {
            airlineid: document.getElementById('airlineId').value.trim().toUpperCase(),
            al_name: document.getElementById('airlineName').value.trim(),
            three_digit_code: document.getElementById('airlineThreeDigitCode').value.trim() || null
        };

        if (!airlineData.airlineid || !airlineData.al_name) {
            alert("Please fill in Airline ID and Airline Name.");
            return;
        }
        if (airlineData.airlineid.length !== 3) {
            alert("Airline ID must be 3 characters.");
            return;
        }
        if (airlineData.three_digit_code && airlineData.three_digit_code.length !== 3) {
            alert("Three Digit Code must be 3 characters or empty.");
            return;
        }

        console.log("Adding Airline:", airlineData);
        sendData('/add_airline', airlineData, 'Airline');
    });

    function resetAddModal() {
        addTypeSelection.style.display = 'block';
        passengerFormDiv.style.display = 'none';
        flightFormDiv.style.display = 'none';
        ticketFormDiv.style.display = 'none';
        airlineFormDiv.style.display = 'none';

        document.getElementById('passengerForm').reset();
        document.getElementById('flightForm').reset();
        document.getElementById('ticketForm').reset();
        document.getElementById('airlineForm').reset();

        document.getElementById('passengerFlightCode').innerHTML = '<option value="">Select Flight</option>';
        document.getElementById('flightAirline').innerHTML = '<option value="">Select Airline</option>';
        document.getElementById('ticketPassenger').innerHTML = '<option value="">Select Passenger</option>';
    }

    function sendData(url, data, itemType) {
        console.log(`Sending data to ${url}:`, data);
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    console.error(`Backend error for ${url}:`, err);
                    throw new Error(`Failed to add ${itemType}: ${err.error || response.statusText}`);
                }).catch(() => {
                    console.error(`Network or non-JSON error for ${url}. Status: ${response.status}`);
                    throw new Error(`Failed to add ${itemType}. Server responded with status ${response.status}.`);
                });
            }
            return response.json();
        })
        .then(result => {
            console.log(`Backend success response for ${url}:`, result);
            if (result.success) {
                alert(`${itemType} added successfully!`);
                resetAddModal();
                addDataModal.hide(); // Move this before the refresh calls
                if (itemType === 'Passenger') loadPassengers();
                if (itemType === 'Flight') loadFlights();
                if (itemType === 'Ticket') loadTickets();
                if (itemType === 'Airline') {
                    loadFlights(); // Refresh flights as they depend on airlines
                    populateAirlineDropdown('#flightAirline'); // Refresh dropdowns
                }
                loadDashboardData();
            } else {
                console.error(`Backend reported success: false for ${url}:`, result);
                alert(`Error adding ${itemType}: ${result.error || 'Unknown error'}`);
            }
        })
        .catch(error => {
            console.error('Fetch or client-side error:', error);
            alert(`An error occurred: ${error.message}`);
            resetAddModal();
            addDataModal.hide();
        });
    }

    function populateAirlineDropdown(selectId) {
        const selectElement = document.querySelector(selectId);
        fetch('/airlines')
            .then(response => response.json())
            .then(airlines => {
                airlines.forEach(airline => {
                    const option = document.createElement('option');
                    option.value = airline.airlineid;
                    option.textContent = `${airline.al_name} (${airline.airlineid})`;
                    selectElement.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error loading airlines for dropdown:', error);
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Error loading airlines';
                selectElement.appendChild(option);
                selectElement.disabled = true;
            });
    }

    function populateFlightDropdown(selectId) {
        const selectElement = document.querySelector(selectId);
        fetch('/flights_list')
            .then(response => response.json())
            .then(flights => {
                flights.forEach(flight => {
                    const option = document.createElement('option');
                    option.value = flight.flight_code;
                    option.textContent = `${flight.flight_code} (${flight.source} to ${flight.destination})`;
                    selectElement.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error loading flights for dropdown:', error);
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Error loading flights';
                selectElement.appendChild(option);
                selectElement.disabled = true;
            });
    }

    function populatePassengerDropdown(selectId) {
        const selectElement = document.querySelector(selectId);
        fetch('/passengers')
            .then(response => response.json())
            .then(passengers => {
                passengers.forEach(passenger => {
                    const option = document.createElement('option');
                    option.value = passenger.passport_no;
                    option.textContent = `${passenger.first_name} ${passenger.last_name} (${passenger.passport_no})`;
                    selectElement.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error loading passengers for dropdown:', error);
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Error loading passengers';
                selectElement.appendChild(option);
                selectElement.disabled = true;
            });
    }

    document.getElementById('refresh-flights')?.addEventListener('click', loadFlights);
    document.getElementById('refresh-passengers')?.addEventListener('click', loadPassengers);
    document.getElementById('refresh-employees')?.addEventListener('click', loadEmployees);
    document.getElementById('refresh-airports')?.addEventListener('click', loadAirports);
    document.getElementById('refresh-tickets')?.addEventListener('click', loadTickets);

    loadDashboardData();

    function loadDashboardData() {
        fetch('/flights')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(flights => {
                document.getElementById('total-flights').textContent = flights.length;

                const recentFlightsBody = document.querySelector('#recent-flights tbody');
                recentFlightsBody.innerHTML = '';

                flights.sort((a, b) => a.departure.localeCompare(b.departure));

                flights.slice(0, 5).forEach(flight => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${flight.flight_code}</td>
                        <td>${flight.airline}</td>
                        <td>${flight.source}</td>
                        <td>${flight.destination}</td>
                        <td><span class="badge-status ${flight.status === 'On-time' ? 'badge-on-time' : flight.status === 'Delayed' ? 'badge-delayed' : 'badge-cancelled'}">${flight.status}</span></td>
                    `;
                    recentFlightsBody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error loading dashboard flights:', error);
                document.getElementById('total-flights').textContent = 'N/A';
                document.querySelector('#recent-flights tbody').innerHTML = '<tr><td colspan="5" class="text-danger">Error loading data</td></tr>';
            });

        fetch('/passengers')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(passengers => {
                document.getElementById('total-passengers').textContent = passengers.length;

                const recentPassengersBody = document.querySelector('#recent-passengers tbody');
                recentPassengersBody.innerHTML = '';

                passengers.sort((a, b) => a.last_name.localeCompare(b.last_name));

                passengers.slice(0, 5).forEach(passenger => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${passenger.first_name} ${passenger.last_name}</td>
                        <td>${passenger.passport_no}</td>
                        <td>${passenger.flight_code || 'N/A'}</td>
                    `;
                    recentPassengersBody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error loading dashboard passengers:', error);
                document.getElementById('total-passengers').textContent = 'N/A';
                document.querySelector('#recent-passengers tbody').innerHTML = '<tr><td colspan="3" class="text-danger">Error loading data</td></tr>';
            });

        fetch('/employees')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(employees => {
                document.getElementById('total-employees').textContent = employees.length;
            })
            .catch(error => {
                console.error('Error loading dashboard employees:', error);
                document.getElementById('total-employees').textContent = 'N/A';
            });
    }

    function loadFlights() {
        const tableBody = document.querySelector('#flights-table tbody');
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>';

        fetch('/flights')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(flights => {
                tableBody.innerHTML = '';

                flights.forEach(flight => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${flight.flight_code}</td>
                        <td>${flight.airline}</td>
                        <td>${flight.source}</td>
                        <td>${flight.destination}</td>
                        <td>${flight.departure}</td>
                        <td>${flight.arrival}</td>
                        <td><span class="badge-status ${flight.status === 'On-time' ? 'badge-on-time' : flight.status === 'Delayed' ? 'badge-delayed' : 'badge-cancelled'}">${flight.status}</span></td>
                        <td>${flight.flight_type}</td>
                    `;
                    tableBody.appendChild(row);
                });
            })
            .catch(error => {
                tableBody.innerHTML = '<tr><td colspan="8" class="text-danger">Error loading flights data: ' + error.message + '</td></tr>';
                console.error('Error:', error);
            });
    }

    function loadPassengers() {
        const tableBody = document.querySelector('#passengers-table tbody');
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>';

        fetch('/passengers')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(passengers => {
                tableBody.innerHTML = '';

                passengers.forEach(passenger => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${passenger.pid}</td>
                        <td>${passenger.first_name} ${passenger.last_name}</td>
                        <td>${passenger.passport_no}</td>
                        <td>${passenger.age}</td>
                        <td>${passenger.sex}</td>
                        <td>${passenger.address}</td>
                        <td>${passenger.phone}</td>
                        <td>${passenger.flight_code || 'N/A'}</td>
                    `;
                    tableBody.appendChild(row);
                });
            })
            .catch(error => {
                tableBody.innerHTML = '<tr><td colspan="8" class="text-danger">Error loading passengers data: ' + error.message + '</td></tr>';
                console.error('Error:', error);
            });
    }

    function loadEmployees() {
        const tableBody = document.querySelector('#employees-table tbody');
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>';

        fetch('/employees')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(employees => {
                tableBody.innerHTML = '';

                employees.forEach(employee => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${employee.ssn}</td>
                        <td>${employee.first_name} ${employee.last_name}</td>
                        <td>${employee.job_type}</td>
                        <td>$${employee.salary ? employee.salary.toLocaleString() : 'N/A'}</td>
                        <td>${employee.position || 'N/A'}</td>
                        <td>${employee.airport}</td>
                    `;
                    tableBody.appendChild(row);
                });
            })
            .catch(error => {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-danger">Error loading employees data: ' + error.message + '</td></tr>';
                console.error('Error:', error);
            });
    }

    function loadAirports() {
        const tableBody = document.querySelector('#airports-table tbody');
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>';

        fetch('/airports')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(airports => {
                tableBody.innerHTML = '';

                airports.forEach(airport => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${airport.name}</td>
                        <td>${airport.city}</td>
                        <td>${airport.state}</td>
                        <td>${airport.country}</td>
                    `;
                    tableBody.appendChild(row);
                });
            })
            .catch(error => {
                tableBody.innerHTML = '<tr><td colspan="4" class="text-danger">Error loading airports data: ' + error.message + '</td></tr>';
                console.error('Error:', error);
            });
    }

    function loadTickets() {
        const tableBody = document.querySelector('#tickets-table tbody');
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>';
    
        fetch('/tickets')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(tickets => {
                tableBody.innerHTML = '';
    
                tickets.forEach(ticket => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${ticket.ticket_number}</td>
                        <td>${ticket.passenger_name}</td>
                        <td>${ticket.source}</td>
                        <td>${ticket.destination}</td>
                        <td>${ticket.class}</td>
                        <td>${ticket.seat_no || 'N/A'}</td>
                        <td>$${ticket.price ? ticket.price.toLocaleString() : 'N/A'}</td>
                        <td>${ticket.travel_date || 'N/A'}</td>
                        <td><span class="badge-status ${ticket.status === 'Active' ? 'badge-on-time' : 'badge-cancelled'}">${ticket.status}</span></td>
                    `;
                    tableBody.appendChild(row);
                });
            })  
            .catch(error => {
                tableBody.innerHTML = '<tr><td colspan="9" class="text-danger">Error loading tickets data: ' + error.message + '</td></tr>';
                console.error('Error:', error);
            });
    }
});