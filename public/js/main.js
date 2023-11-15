let currentFlights = [];
let currentPage = 1;
const flightsPerPage = 15;
let currentSort = {
    column: 'year',
    ascending: true
};
let map; // Global map variable
let polyline; // Global polyline variable

document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/enriched-flights')
        .then(response => response.json())
        .then(flights => {
            currentFlights = flights.sort((a, b) => {
                return a.year - b.year || a.month - b.month || a.flightNumber.localeCompare(b.flightNumber);
            });
            displayPage(currentPage);
            initializeMap(); // You will call this function with actual data when a row is clicked
        })
        .catch(error => console.error('Error fetching flights:', error));
});

function initializeMap() {
    // Initialize the map on the 'map' div with a given center and zoom
    map = L.map('map').setView([0, 0], 2); // Set a default center

    // Add OpenStreetMap tile layer to the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
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
            fetchFlightCoordinates(flight.flightNumber);
        });

        dataKeys.forEach(key => {
            const cell = row.insertCell();
            cell.textContent = flight[key] || ''; // Use || '' to handle undefined or null values
        });
    });

    return table;
}

// Function to fetch and display flight coordinates when a row is clicked
function fetchFlightCoordinates(flightNumber) {
    displayLoadingIndicator(true); // Show loading indicator
    fetch(`/api/flight-coordinates/${flightNumber}`)
        .then(response => response.json())
        .then(coordinates => {
            updateMap(coordinates.originLat, coordinates.originLon, coordinates.destinationLat, coordinates.destinationLon);
            displayLoadingIndicator(false); // Hide loading indicator
        })
        .catch(error => {
            console.error('Error fetching coordinates:', error);
            displayErrorMessage('Coordinates not found.');
            displayLoadingIndicator(false); // Hide loading indicator
        });
}

// Function to update the map with the flight path
function updateMap(originLat, originLon, destinationLat, destinationLon) {
    const origin = [parseFloat(originLat), parseFloat(originLon)];
    const destination = [parseFloat(destinationLat), parseFloat(destinationLon)];

    // Clear the existing polyline if it exists
    if (polyline) {
        map.removeLayer(polyline);
    }

    // Draw the new polyline on the map
    polyline = L.polyline([origin, destination], { color: 'blue' }).addTo(map);
    map.fitBounds(polyline.getBounds());
}


// Functions to show or hide the loading indicator and error messages
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

// ... rest of your code for sorting and pagination ...

// Remember to add your CSS for the loading indicator and error message in styles.css


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


