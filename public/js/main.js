
let map; // Global map variable
let polyline; // Global polyline variable
let currentFlights = [];
let currentPage = 1;
const flightsPerPage = 15;
let currentSort = {
    column: 'year',
    ascending: true
};

let currentPassengers = [];
let currentPassengerPage = 1;
const passengersPerPage = 15;


document.addEventListener('DOMContentLoaded', function() {
    // Fetch the airport data first to initialize the map
    fetch('/api/airports')
        .then(response => response.json())
        .then(airportsData => {
            // Initialize the map with airport markers
            initializeMap(airportsData);

            // Then fetch the flights data to populate the table
            fetch('/api/enriched-flights')
                .then(response => response.json())
                .then(flights => {
                    currentFlights = flights.sort((a, b) => {
                        return a.year - b.year || 
                               a.month - b.month || 
                               a.flightNumber.localeCompare(b.flightNumber);
                    });
                    displayPage(currentPage);
                })
                .catch(error => console.error('Error fetching flights:', error));
        })
        .catch(error => console.error('Error fetching airports:', error));

    // Añadir Event Listener al campo de entrada para filtrar pasajeros automáticamente al escribir
    document.getElementById('passenger-search-input').addEventListener('input', filterPassengers);
});
/////MAP////////////
function initializeMap(airportsData) {
    // Initialize the map on the 'map' div with a given center and zoom
    map = L.map('map').setView([0, 0], 2); // Set a default center

    // Add OpenStreetMap tile layer to the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add airport markers
    addAirportMarkers(airportsData);
}
function addAirportMarkers(airportsData) {
    airportsData.forEach(airport => {
        const marker = L.marker([airport.lat, airport.lon]).addTo(map);
        const airportInfo = `
            <strong>${airport.name}</strong><br>
            City: ${airport.city}<br>
            Country: ${airport.country}<br>
            IATA: ${airport.airportIATA}
        `;
        marker.bindPopup(airportInfo);
    });
}
// Function to update the map with the flight path
function updateMap(originLat, originLon, destinationLat, destinationLon, flightDetails) {
    const origin = [parseFloat(originLat), parseFloat(originLon)];
    const destination = [parseFloat(destinationLat), parseFloat(destinationLon)];

    // Clear the existing polyline and markers if they exist
    if (polyline) {
        map.removeLayer(polyline);
    }
    if (map.flightPathMarker) {
        map.removeLayer(map.flightPathMarker);
    }

    // Draw the new polyline on the map
        polyline = L.polyline([origin, destination], { color: 'blue' }).addTo(map);

        // Bind click event to polyline
        polyline.on('click', () => {
            // Open the popup manually
            map.flightPathMarker.openPopup();
        });
    
    // Set the view to fit the bounds of the polyline
    map.fitBounds(polyline.getBounds());

    // Calculate the midpoint for the flight path marker
    const midpoint = L.latLng(
        (origin[0] + destination[0]) / 2,
        (origin[1] + destination[1]) / 2
    );

    // Create a marker at the midpoint of the flight path
    map.flightPathMarker = L.marker(midpoint, {
        icon: L.divIcon({
            className: 'flight-path-marker', // Define a custom class in your CSS
            html: '✈️', // This could be any HTML, like an SVG or image
            iconSize: [24, 24]
        })
    }).addTo(map);

    // Bind a popup to the flight path marker with flight details
    const flightInfo = `
        <strong>Flight Information:</strong><br>
        Flight Number: ${flightDetails.flightNumber}<br>
        Origin: ${flightDetails.originCity} (${flightDetails.originIATA})<br>
        Destination: ${flightDetails.destinationCity} (${flightDetails.destinationIATA})<br>
        Airline: ${flightDetails.airline}<br>
        Aircraft: ${flightDetails.aircraftName}<br>
        Average Age: ${flightDetails.averageAge}<br>
        Distance: ${flightDetails.distance} km<br>
        Total Passengers: ${flightDetails.totalPassengers}
    `;
    map.flightPathMarker.bindPopup(flightInfo);
}
//////////////MAP//////////////

//////////////FLIGHTS////////////////////////////////////////

function fetchFlightCoordinates(flightNumber) {
    displayLoadingIndicator(true); // Show loading indicator
    fetch(`/api/flight-coordinates/${flightNumber}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Coordinates not found for flight number: ' + flightNumber);
            }
            return response.json();
        })
        .then(coordinates => {
            const flightDetails = currentFlights.find(flight => flight.flightNumber === flightNumber);
            updateMap(coordinates.originLat, coordinates.originLon, coordinates.destinationLat, coordinates.destinationLon, flightDetails);
            displayLoadingIndicator(false); // Hide loading indicator
        })
        .catch(error => {
            console.error('Error fetching coordinates:', error);
            displayErrorMessage('Coordinates not found.');
            displayLoadingIndicator(false); // Hide loading indicator
        });
}
function createFlightsTable(flights) {
    const table = document.createElement('table');
    table.id = 'flights-table'; // Assign an ID to the table for styling
    const headerRow = table.createTHead().insertRow();

    // Define the headers for the table
    const headers = [
        'Year', 'Month', 'Flight ID', 
        'Origin', 'Origin City', 'Destination', 'Destination City', 
        'Airline', 'Average Age', 'Distance', 'Aircraft Name', 'Total Passengers'
    ];
    const dataKeys = [
        'year', 'month', 'flightNumber', 
        'originIATA', 'originCity', 'destinationIATA', 'destinationCity', 
        'airline', 'averageAge', 'distance', 'aircraftName', 'totalPassengers'
    ];
    
    headers.forEach((headerText, index) => {
        const headerCell = document.createElement('th');
        headerCell.textContent = headerText;
        headerCell.classList.add('sortable');
        headerCell.setAttribute('data-sort', dataKeys[index]);
        headerCell.onclick = function() {
            sortTable(dataKeys[index]);
        };
        headerRow.appendChild(headerCell);
    });

    // Create a row for each flight and append cells
    const tbody = table.createTBody();
    flights.forEach(flight => {
        const row = tbody.insertRow();
        row.classList.add('flight-row'); // Add class for styling
        row.setAttribute('data-flight-number', flight.flightNumber); // Set data attribute

        // Add event listener to each row for the click event
        row.addEventListener('click', function() {
            // Call a function to handle the click event
            showFlightNumber(flight.flightNumber); // Function to show the flight number
            fetchFlightCoordinates(flight.flightNumber);
            fetchFlightPassengers(flight.flightNumber);
        });

        dataKeys.forEach(key => {
            const cell = row.insertCell();
            cell.textContent = flight[key] || ''; // Use || '' to handle undefined or null values
        });
    });

    return table;
}
function displayPage(page, flightsData = currentFlights) {
    const startIndex = (page - 1) * flightsPerPage;
    const endIndex = startIndex + flightsPerPage;
    const pageFlights = flightsData.slice(startIndex, endIndex);

    const tableContainer = document.getElementById('flights-table-container');
    tableContainer.innerHTML = ''; // Clear existing table content
    tableContainer.appendChild(createFlightsTable(pageFlights));

    setupPagination(flightsData.length, flightsPerPage); // Use filtered flights length for pagination
}
function sortTable(sortKey) {
    if (currentSort.column === sortKey) {
        currentSort.ascending = !currentSort.ascending;
    } else {
        currentSort = {
            column: sortKey,
            ascending: true
        };
    }

    currentFlights.sort((a, b) => {
        if (a[sortKey] == b[sortKey]) return 0;
        if (currentSort.ascending) {
            return a[sortKey] < b[sortKey] ? -1 : 1;
        } else {
            return a[sortKey] > b[sortKey] ? -1 : 1;
        }
    });

    displayPage(1); // Start at page 1 after sorting
}
function filterFlights() {
    const searchOrigin = document.getElementById('search-origin').value.toLowerCase();
    const searchDestination = document.getElementById('search-destination').value.toLowerCase();
    
    const filteredFlights = currentFlights.filter(flight => {
        const originMatches = searchOrigin ? flight.originCity.toLowerCase().includes(searchOrigin) : true;
        const destinationMatches = searchDestination ? flight.destinationCity.toLowerCase().includes(searchDestination) : true;
        return originMatches && destinationMatches;
    });

    // Update the table with the filtered flights
    displayPage(1, filteredFlights); // Reset to the first page when filter changes
}
function setupPagination(totalFlights, flightsPerPage) {
    const pageCount = Math.ceil(totalFlights / flightsPerPage);
    const paginationContainer = document.querySelector('.pagination');
    paginationContainer.innerHTML = ''; // Clear existing pagination content

    // Determine the range of page numbers to display
    const maxPageNumbersToShow = 5; // Set the max number of pagination buttons
    let startPage = Math.max(currentPage - Math.floor(maxPageNumbersToShow / 2), 1);
    let endPage = startPage + maxPageNumbersToShow - 1;

    // Adjust if the end page goes beyond the total page count
    if (endPage > pageCount) {
        endPage = pageCount;
        startPage = Math.max(endPage - maxPageNumbersToShow + 1, 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageNumber = document.createElement('span');
        pageNumber.textContent = i;
        pageNumber.className = 'page-number' + (i === currentPage ? ' active' : '');
        pageNumber.addEventListener('click', function() {
            currentPage = i;
            displayPage(currentPage);
            setupPagination(totalFlights, flightsPerPage); // Re-setup pagination to update active class
        });
        paginationContainer.appendChild(pageNumber);
    }
}

/////Passengers//////////////////////////////////////////
function fetchFlightPassengers(flightNumber) {
    displayLoadingIndicator(true); // Muestra el indicador de carga
    fetch(`/api/flight-passengers/${flightNumber}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Pasajeros no encontrados para el número de vuelo: ' + flightNumber);
            }
            return response.json();
        })
        .then(passengers => {
            currentPassengers = passengers; // Actualiza la lista de pasajeros
            currentPassengerPage = 1; // Restablece a la primera página
            createPassengersTable();
            setupPassengerPagination();
            displayLoadingIndicator(false); // Oculta el indicador de carga
        })
        .catch(error => {
            console.error('Error al obtener pasajeros:', error);
            displayErrorMessage('Pasajeros no encontrados.');
            displayLoadingIndicator(false); // Oculta el indicador de carga
        });
}

// Función para crear y mostrar la tabla de pasajeros
function createPassengersTable(passengers = currentPassengers) {
    const startIndex = (currentPassengerPage - 1) * passengersPerPage;
    const endIndex = startIndex + passengersPerPage;
    const pagePassengers = passengers.slice(startIndex, endIndex);

    const tableContainer = document.getElementById('passengers-table-container');
    if (!tableContainer) return;

    const table = document.createElement('table');
    table.id = 'passengers-table';
    const thead = table.createTHead();
    const tbody = table.createTBody();
    tableContainer.innerHTML = ''; // Limpia cualquier contenido anterior

    // Encabezados de la tabla
    const headers = ['Avatar', 'First Name', 'Last Name', 'Full Name', 'Age', 'Gender', 'Weight', 'Height', 'Seat Number'];
    const headerRow = thead.insertRow();
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    // Agrega filas para los pasajeros de la página actual
    pagePassengers.forEach(passenger => {
        const row = tbody.insertRow();
        row.insertCell().innerHTML = `<img src="${passenger.avatar}" alt="Avatar" style="width:50px;">`;
        row.insertCell().textContent = passenger.firstName;
        row.insertCell().textContent = passenger.lastName;
        row.insertCell().textContent = `${passenger.firstName} ${passenger.lastName}`;
        row.insertCell().textContent = passenger.age;
        row.insertCell().textContent = passenger.gender;
        row.insertCell().textContent = `${passenger['weight(kg)']} kg`;
        row.insertCell().textContent = `${passenger['height(cm)']} cm`;
        row.insertCell().textContent = passenger.seatNumber;
    });

    tableContainer.appendChild(table);
}

function setupPassengerPagination(totalPassengers) {
    const pageCount = Math.ceil(totalPassengers / passengersPerPage);
    const paginationContainer = document.querySelector('.passenger-pagination');
    paginationContainer.innerHTML = '';

    for (let i = 1; i <= pageCount; i++) {
        const pageNumber = document.createElement('span');
        pageNumber.textContent = i;
        pageNumber.className = 'page-number' + (i === currentPassengerPage ? ' active' : '');
        pageNumber.addEventListener('click', () => {
            currentPassengerPage = i;
            createPassengersTable(); // Aquí se podría pasar la lista de pasajeros actual, si se desea
        });
        paginationContainer.appendChild(pageNumber);
    }
}

function filterPassengers() {
    const searchInput = document.getElementById('passenger-search-input').value.toLowerCase();
    const filteredPassengers = currentPassengers.filter(passenger =>
        passenger.firstName.toLowerCase().includes(searchInput) || 
        passenger.lastName.toLowerCase().includes(searchInput)
    );

    currentPassengerPage = 1;
    createPassengersTable(filteredPassengers);
    setupPassengerPagination(filteredPassengers.length);
}



////////////////////////////UI/////////////////////////////
function showFlightNumber(flightNumber) {
    // You might want to create a dedicated area in your HTML to show the selected flight number.
    // For example, an element with the ID 'selected-flight-number'.
    // Here's how you can update its content:
    const flightNumberDisplay = document.getElementById('selected-flight-number');
    if (flightNumberDisplay) {
        flightNumberDisplay.textContent = `${flightNumber}`;
    }
}

function displayLoadingIndicator(show) {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'block' : 'none';
    }
}

function displayErrorMessage(message) {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
}





