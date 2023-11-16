
let map; // Global map variable
let polyline; // Global polyline variable
let graphicsData; // Almacena los datos del gráfico globalmente
let myChart;     // Almacena la instancia del gráfico globalmente
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

let currentPassengerSort = {
    column: null,
    ascending: true
};





document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el mapa y cargar datos de aeropuertos
    fetch('/api/airports')
        .then(response => response.json())
        .then(airportsData => {
            initializeMap(airportsData);
            return fetch('/api/enriched-flights');
        })
        .then(response => response.json())
        .then(flights => {
            currentFlights = flights.sort((a, b) => a.year - b.year || a.month - b.month || a.flightNumber.localeCompare(b.flightNumber));
            displayPage(currentPage);
            return fetch('/api/graphics1');
        })
        .then(response => response.json())
        .then(data => {
            
            graphicsData = data;
            fillYearDropdown(); 
            myChart = initializeChart(); 
        })
        .catch(error => console.error('Error:', error));

    document.getElementById('yearSelector').addEventListener('change', function() {
        updateChart(this.value);
    });
    document.getElementById('passenger-search-input').addEventListener('input', filterPassengers);

    initializeChart();
    initializePieChart();
    updatePieChart(new Date().getFullYear().toString());
    fillYearDropdownPie();
    initializePyramidChart();
    fillYearDropdownPyramid();
    updateChartVisibility(document.getElementById('chartTypeSelector').value);
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
            setupPassengerPagination(currentPassengers.length); // Ajustado
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

    tableContainer.innerHTML = ''; // Limpia cualquier contenido anterior
    const table = document.createElement('table');
    table.id = 'passengers-table';
    
    // Crear y agregar encabezados de la tabla
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    const headers = ['Avatar', 'First Name', 'Last Name', 'Full Name', 'Age', 'Gender', 'Weight', 'Height', 'Seat Number'];

    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    // Crear cuerpo de la tabla y agregar filas para los pasajeros
    const tbody = table.createTBody();
    pagePassengers.forEach(passenger => {
        const row = tbody.insertRow();
        row.insertCell().innerHTML = passenger.avatar ? `<img src="${passenger.avatar}" alt="Avatar" style="width:50px;">` : '';
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


function setupPassengerPagination(totalPassengers = currentPassengers.length) {
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

function sortPassengerTable(sortKey) {
    if (currentPassengerSort.column === sortKey) {
        currentPassengerSort.ascending = !currentPassengerSort.ascending;
    } else {
        currentPassengerSort = {
            column: sortKey,
            ascending: true
        };
    }

    currentPassengers.sort((a, b) => {
        if (a[sortKey] === b[sortKey]) return 0;
        if (currentPassengerSort.ascending) {
            return a[sortKey] < b[sortKey] ? -1 : 1;
        } else {
            return a[sortKey] > b[sortKey] ? -1 : 1;
        }
    });

    createPassengersTable(); // Reconstruye la tabla con los datos ordenados
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

/////////////////////////GRAFICO 1/////////////////////////////
function fillYearDropdown() {
    const yearSelector = document.getElementById('yearSelector');
    const uniqueYears = [...new Set(graphicsData.map(item => item.year))]; // Obtener años únicos

    uniqueYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelector.appendChild(option);
    });
}
function initializeChart() {
    const ctx = document.getElementById('myChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '',
                data: [],
                // Estilos adicionales
            }]
        },
        options: {
            // Opciones del gráfico
        }
    });

    const initialYear = new Date().getFullYear().toString(); // Año actual como predeterminado
    const initialFeature = 'totalDistance'; // Característica predeterminada
    updateChart(initialYear, initialFeature); // Inicializar el gráfico con datos predeterminados
}

function updateChart(selectedYear, selectedFeature) {
    if (!myChart || !graphicsData) {
        console.error('Chart or graphics data is not initialized');
        return;
    }

    // Asegurarse de que la característica seleccionada es válida
    if (!['totalDistance', 'totalWeight', 'averageHeight'].includes(selectedFeature)) {
        console.error('Selected feature is not valid');
        return;
    }

    const filteredData = graphicsData.filter(item => item.year === selectedYear);

    myChart.data.labels = filteredData.map(item => item.month);
    myChart.data.datasets[0].label = getFeatureLabel(selectedFeature); // Función para obtener el label adecuado
    myChart.data.datasets[0].data = filteredData.map(item => Number(item[selectedFeature]));

    myChart.update();
}
function getFeatureLabel(feature) {
    switch(feature) {
        case 'totalDistance':
            return 'Distancia Recorrida';
        case 'totalWeight':
            return 'Peso Transportado';
        case 'averageHeight':
            return 'Promedio de Altura';
        default:
            return '';
    }
}

document.getElementById('yearSelector').addEventListener('change', function() {
    const selectedYear = this.value;
    const selectedFeature = document.getElementById('featureSelector').value;
    updateChart(selectedYear, selectedFeature);
});

document.getElementById('featureSelector').addEventListener('change', function() {
    const selectedYear = document.getElementById('yearSelector').value;
    const selectedFeature = this.value;
    updateChart(selectedYear, selectedFeature);
});

////////////////////////OIE CHART/////////////////////////

// Función para inicializar el gráfico de pastel
function initializePieChart() {
    const ctxPie = document.getElementById('myPieChart').getContext('2d');
    window.myPieChart = new Chart(ctxPie, {
        type: 'pie',
        data: {
            labels: [], // Etiquetas de las aerolíneas
            datasets: [{
                label: 'Cantidad de Vuelos por Aerolínea',
                data: [], // Datos de la cantidad de vuelos
                backgroundColor: [], // Colores de fondo para cada segmento del pastel
                // Estilos adicionales si son necesarios
            }]
        },
        options: {
            // Opciones del gráfico de pastel
        }
    });
}

// Función para actualizar el gráfico de pastel
function updatePieChart(selectedYear, selectedFeature) {
    fetch(`/api/graphics2`)
        .then(response => response.json())
        .then(data => {
            const yearData = data[selectedYear];
            const airlines = Object.keys(yearData);
            let flightsCounts;

            if (selectedFeature === 'total') {
                flightsCounts = airlines.map(airline => 
                    Object.values(yearData[airline]).reduce((a, b) => a + b, 0)
                );
            } else {
                flightsCounts = airlines.map(airline => 
                    yearData[airline][selectedFeature] || 0
                );
            }

            window.myPieChart.data.labels = airlines;
            window.myPieChart.data.datasets[0].data = flightsCounts;
            window.myPieChart.data.datasets[0].backgroundColor = generateRandomColors(airlines.length);
            window.myPieChart.update();
        })
        .catch(error => console.error('Error fetching graphics2 data:', error));
}


// Función para generar colores aleatorios
function generateRandomColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(`hsl(${Math.random() * 360}, 70%, 50%)`);
    }
    return colors;
}

// Función para llenar el dropdown de años para el gráfico de pastel
function fillYearDropdownPie() {
    fetch('/api/graphics2')
        .then(response => response.json())
        .then(data => {
            const yearSelectorPie = document.getElementById('yearSelectorPie');
            const years = Object.keys(data);

            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelectorPie.appendChild(option);
            });

            // Inicializar el gráfico de pastel con el primer año disponible
            if (years.length > 0) {
                updatePieChart(years[0]);
            }
        })
        .catch(error => console.error('Error fetching graphics2 data:', error));
}


document.getElementById('yearSelectorPie').addEventListener('change', function() {
    const selectedYear = this.value;
    const selectedFeature = document.getElementById('featureSelectorPie').value;
    updatePieChart(selectedYear, selectedFeature);
});

document.getElementById('featureSelectorPie').addEventListener('change', function() {
    const selectedYear = document.getElementById('yearSelectorPie').value;
    const selectedFeature = this.value;
    updatePieChart(selectedYear, selectedFeature);
});

function initializePyramidChart() {
    const ctxPyramid = document.getElementById('myPyramidChart').getContext('2d');
    window.myPyramidChart = new Chart(ctxPyramid, {
        type: 'bar',
        data: {
            labels: [], // Etiquetas de los grupos de edad
            datasets: [
                {
                    label: 'Male',
                    data: [], // Datos para hombres
                    backgroundColor: 'blue'
                },
                {
                    label: 'Female',
                    data: [], // Datos para mujeres
                    backgroundColor: 'pink'
                }
            ]
        },
        options: {
            scales: {
                xAxes: [{ stacked: true }],
                yAxes: [{ stacked: true }]
            },
            // Otras opciones si son necesarias
        }
    });
}

function updatePyramidChart(selectedYear) {
    fetch(`/api/graphics3`)
        .then(response => response.json())
        .then(data => {
            const yearData = data[selectedYear];
            const ageGroups = Object.keys(yearData).sort();
            const maleData = ageGroups.map(group => -Math.abs(yearData[group].male)); // Negativo para el lado izquierdo
            const femaleData = ageGroups.map(group => yearData[group].female);

            window.myPyramidChart.data.labels = ageGroups;
            window.myPyramidChart.data.datasets[0].data = maleData;
            window.myPyramidChart.data.datasets[1].data = femaleData;
            window.myPyramidChart.update();
        })
        .catch(error => console.error('Error fetching graphics3 data:', error));
}

// Función para llenar el dropdown de años para el gráfico de pirámide
function fillYearDropdownPyramid() {
    fetch('/api/graphics3')
        .then(response => response.json())
        .then(data => {
            const yearSelectorPyramid = document.getElementById('yearSelectorPyramid');
            const years = Object.keys(data);

            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelectorPyramid.appendChild(option);
            });

            // Inicializar el gráfico de pirámide con el primer año disponible
            if (years.length > 0) {
                updatePyramidChart(years[0]);
            }
        })
        .catch(error => console.error('Error fetching graphics3 data:', error));
}

document.getElementById('yearSelectorPyramid').addEventListener('change', function() {
    updatePyramidChart(this.value);
});

function updateChartVisibility(selectedChart) {
    const lineChartOptions = document.querySelector('.line-chart-options');
    const pieChartOptions = document.querySelector('.pie-chart-options');
    const pyramidChartOptions = document.querySelector('.pyramid-chart-options');

    // Ocultar todas las opciones de gráficos
    lineChartOptions.style.display = 'none';
    pieChartOptions.style.display = 'none';
    pyramidChartOptions.style.display = 'none';

    // Mostrar las opciones del gráfico seleccionado
    switch(selectedChart) {
        case 'lineChart':
            lineChartOptions.style.display = 'block';
            break;
        case 'pieChart':
            pieChartOptions.style.display = 'block';
            break;
        case 'pyramidChart':
            pyramidChartOptions.style.display = 'block';
            break;
    }
}

// Event listener para el selector de tipo de gráfico
document.getElementById('chartTypeSelector').addEventListener('change', function() {
    updateChartVisibility(this.value);
});




