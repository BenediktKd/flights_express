let currentFlights = [];
let currentPage = 1;
const flightsPerPage = 15;
let currentSort = {
    column: 'year',
    ascending: true
};


document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/enriched-flights')
        .then(response => response.json())
        .then(flights => {
            // Sort flights by year, then month, then flight identifier upon initial fetch
            currentFlights = flights.sort((a, b) => {
                return a.year - b.year || 
                       a.month - b.month || 
                       a.flightNumber.localeCompare(b.flightNumber);
            });
            displayPage(currentPage);
        })
        .catch(error => console.error('Error fetching flights:', error));
});

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
    const headerRow = table.insertRow();

    // Update the headers to include Origin City and Destination City
    const headers = [
        'Year', 'Month', 'Flight ID', 
        'Origin', 'Origin City', 'Destination', 'Destination City', 
        'Airline', 'Average Age', 'Distance', 'Aircraft Name', 'Total Passengers'
    ];
    const sortKeys = [
        'year', 'month', 'flightNumber', 
        'originIATA', 'originCity', 'destinationIATA', 'destinationCity', 
        'airline', 'averageAge', 'distance', 'aircraftName', 'totalPassengers'
    ];
    
    headers.forEach((headerText, index) => {
        const headerCell = document.createElement('th');
        headerCell.textContent = headerText;
        headerCell.classList.add('sortable');
        headerCell.setAttribute('data-sort', sortKeys[index]);
        headerCell.onclick = function() {
            sortTable(sortKeys[index]);
        };
        headerRow.appendChild(headerCell);
    });

    // Add table rows for each flight
    flights.forEach(flight => {
        const row = table.insertRow();
        sortKeys.forEach(key => {
            const cell = row.insertCell();
            cell.textContent = flight[key];
        });
    });

    return table;
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


