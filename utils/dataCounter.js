const path = require('path');
const fs = require('fs').promises;

async function countPassengersPerFlight() {
    const flightsFilePath = path.join('data', 'combined_flights.json');
    const ticketsFilePath = path.join('data', 'tickets.json');
  
    try {
      // Leer los datos de los vuelos
      const flightsData = JSON.parse(await fs.readFile(flightsFilePath, 'utf-8'));
      // Leer los datos de los tickets
      const ticketsData = JSON.parse(await fs.readFile(ticketsFilePath, 'utf-8'));
  
      // Crear un mapa para contar los pasajeros por cada vuelo
      const passengerCountPerFlight = {};
  
      // Inicializar los contadores para cada flightNumber
      flightsData.forEach(flight => {
        passengerCountPerFlight[flight.flightNumber] = 0;
      });
  
      // Contar los tickets para cada flightNumber
      ticketsData.forEach(ticket => {
        if (passengerCountPerFlight.hasOwnProperty(ticket.flightNumber)) {
          passengerCountPerFlight[ticket.flightNumber]++;
        }
      });
  
      // Ahora passengerCountPerFlight contiene la cantidad de pasajeros por vuelo
      console.log(passengerCountPerFlight);
  
      // Si necesitas escribir esta información a un archivo JSON
      const countsFilePath = path.join('data', 'passenger_counts.json');
      await fs.writeFile(countsFilePath, JSON.stringify(passengerCountPerFlight, null, 2), 'utf-8');
      console.log(`La cantidad de pasajeros por vuelo ha sido guardada en ${countsFilePath}`);
    } catch (error) {
      console.error('Error al contar los pasajeros por vuelo:', error);
    }
  }

  // Función para mapear los aircraft IDs a sus nombres
  async function mapAircrafts() {
    const aircraftsData = JSON.parse(await fs.readFile('data/aircrafts.json', 'utf-8'));
    const aircraftMap = {};
    aircraftsData.forEach(aircraft => {
      aircraftMap[aircraft.aircraftID] = aircraft.name;
    });
    return aircraftMap;
  }
  
  // Función para agregar el nombre del avión a cada vuelo
  async function addAircraftNamesToFlights() {
    const aircraftMap = await mapAircrafts();
    const combinedFlightsData = JSON.parse(await fs.readFile('data/combined_flights.json', 'utf-8'));
  
    combinedFlightsData.forEach(flight => {
      if (aircraftMap[flight.aircraftID]) {
        flight.aircraftName = aircraftMap[flight.aircraftID];
      } else {
        flight.aircraftName = 'Unknown'; // O manejar como se vea conveniente
      }
    });
  
    // Guardar o imprimir los datos modificados
    console.log(combinedFlightsData);
    // Puedes descomentar la siguiente línea para guardar los datos en un nuevo archivo
    await fs.writeFile('data/enriched_flights.json', JSON.stringify(combinedFlightsData, null, 2), 'utf-8');
  }
  
// Function to add passenger counts to enriched flights
async function addPassengerCountsToFlights() {
  const passengerCountsFilePath = path.join('data', 'passenger_counts.json');
  const enrichedFlightsFilePath = path.join('data', 'enriched_flights.json');

  // Read and parse the passenger counts file
  const passengerCountsRawData = await fs.readFile(passengerCountsFilePath, 'utf-8');
  const passengerCounts = JSON.parse(passengerCountsRawData);

  // Read and parse the enriched flights file
  const enrichedFlightsRawData = await fs.readFile(enrichedFlightsFilePath, 'utf-8');
  const enrichedFlights = JSON.parse(enrichedFlightsRawData);

  // Add passenger count to each flight based on flightNumber
  const enrichedFlightsWithPassengers = enrichedFlights.map(flight => {
    const passengerCount = passengerCounts[flight.flightNumber];
    return {
      ...flight,
      totalPassengers: passengerCount || 0 // Add totalPassengers key, defaulting to 0 if not found
    };
  });

  // Write the updated flights back to the enriched flights file
  await fs.writeFile(enrichedFlightsFilePath, JSON.stringify(enrichedFlightsWithPassengers, null, 2), 'utf-8');
  console.log('Enriched flights file has been updated with passenger counts.');
}

// Helper function to calculate age from birthDate
function calculateAge(birthDate) {
  const [day, month, year] = birthDate.split('/').map(part => parseInt(part, 10));
  const birthDateObject = new Date(year, month - 1, day);
  const ageDifMs = Date.now() - birthDateObject.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

// Main function to calculate average age per flight
async function addAverageAgeToFlights() {
  const ticketsFilePath = path.join('data', 'tickets.json');
  const passengersFilePath = path.join('data', 'passengers.json');
  const enrichedFlightsFilePath = path.join('data', 'enriched_flights.json');

  // Read and parse the tickets file
  const ticketsRawData = await fs.readFile(ticketsFilePath, 'utf-8');
  const tickets = JSON.parse(ticketsRawData);

  // Read and parse the passengers file
  const passengersRawData = await fs.readFile(passengersFilePath, 'utf-8');
  const passengersData = JSON.parse(passengersRawData);
  const passengers = passengersData.passengers;

  // Create a map of passenger ages
  const passengerAges = {};
  passengers.forEach(passenger => {
    passengerAges[passenger.passengerID] = calculateAge(passenger.birthDate);
  });

  // Create a map to track ages and counts per flight
  const flightAges = {};
  tickets.forEach(ticket => {
    if (!flightAges[ticket.flightNumber]) {
      flightAges[ticket.flightNumber] = [];
    }
    const age = passengerAges[ticket.passengerID];
    if (age) {
      flightAges[ticket.flightNumber].push(age);
    }
  });

  // Calculate average ages per flight
  const averageAges = {};
  Object.keys(flightAges).forEach(flightNumber => {
    const ages = flightAges[flightNumber];
    const averageAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;
    averageAges[flightNumber] = averageAge;
  });

  // Read and parse the enriched flights file
  const enrichedFlightsRawData = await fs.readFile(enrichedFlightsFilePath, 'utf-8');
  const enrichedFlights = JSON.parse(enrichedFlightsRawData);

  // Add average age to each flight in enriched flights
  const enrichedFlightsWithAges = enrichedFlights.map(flight => {
    const averageAge = averageAges[flight.flightNumber];
    return {
      ...flight,
      averageAge: averageAge ? averageAge.toFixed(2) : null // Use toFixed(2) to limit the result to 2 decimal places
    };
  });

  // Write the updated flights back to the enriched flights file
  await fs.writeFile(enrichedFlightsFilePath, JSON.stringify(enrichedFlightsWithAges, null, 2), 'utf-8');
  console.log('Enriched flights file has been updated with average passenger ages.');
}

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
}

// Main function to add distances to flights
async function addDistancesToFlights() {
  const airportsFilePath = path.join('data', 'airports.json');
  const enrichedFlightsFilePath = path.join('data', 'enriched_flights.json');

  // Read and parse the airports file
  const airportsRawData = await fs.readFile(airportsFilePath, 'utf-8');
  const airports = JSON.parse(airportsRawData);

  // Create a map for quick airport lookup by IATA code
  const airportCoords = {};
  airports.forEach(airport => {
    airportCoords[airport.airportIATA] = {
      lat: parseFloat(airport.lat),
      lon: parseFloat(airport.lon)
    };
  });

  // Read and parse the enriched flights file
  const enrichedFlightsRawData = await fs.readFile(enrichedFlightsFilePath, 'utf-8');
  const enrichedFlights = JSON.parse(enrichedFlightsRawData);

  // Calculate and add distance to each flight
  const enrichedFlightsWithDistances = enrichedFlights.map(flight => {
    const originCoords = airportCoords[flight.originIATA];
    const destinationCoords = airportCoords[flight.destinationIATA];

    // Check if we have the coordinates for both the origin and destination airports
    if (originCoords && destinationCoords) {
      const distance = calculateDistance(
        originCoords.lat, originCoords.lon,
        destinationCoords.lat, destinationCoords.lon
      );
      return {
        ...flight,
        distance: distance.toFixed(2) // Round to two decimal places for readability
      };
    } else {
      // If we don't have the coordinates for an airport, we can't calculate the distance
      return {
        ...flight,
        distance: 'Unknown'
      };
    }
  });

  // Write the updated flights back to the enriched flights file
  await fs.writeFile(enrichedFlightsFilePath, JSON.stringify(enrichedFlightsWithDistances, null, 2), 'utf-8');
  console.log('Enriched flights file has been updated with distances.');
}

async function enrichFlightsWithCityNames() {
  // Load and parse the airports file
  const airportsFilePath = path.join('data', 'airports.json');
  const airportsRawData = await fs.readFile(airportsFilePath, 'utf-8');
  const airports = JSON.parse(airportsRawData);

  // Create a map for quick airport lookup by IATA code
  const airportCityMap = {};
  airports.forEach(airport => {
    airportCityMap[airport.airportIATA] = airport.city;
  });

  // Load and parse the enriched flights file
  const enrichedFlightsFilePath = path.join('data', 'enriched_flights.json');
  const enrichedFlightsRawData = await fs.readFile(enrichedFlightsFilePath, 'utf-8');
  const enrichedFlights = JSON.parse(enrichedFlightsRawData);

  // Add origin and destination city names to each flight
  const enrichedFlightsWithCities = enrichedFlights.map(flight => {
    return {
      ...flight,
      originCity: airportCityMap[flight.originIATA] || 'Unknown',
      destinationCity: airportCityMap[flight.destinationIATA] || 'Unknown'
    };
  });

  // Write the updated flights back to the enriched flights file
  await fs.writeFile(enrichedFlightsFilePath, JSON.stringify(enrichedFlightsWithCities, null, 2), 'utf-8');
  console.log('Enriched flights file has been updated with city names.');
}

  module.exports = {
    countPassengersPerFlight,
    addAircraftNamesToFlights,
    addPassengerCountsToFlights,
    addAverageAgeToFlights,
    addDistancesToFlights,
    enrichFlightsWithCityNames
  };