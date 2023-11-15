const fs = require('fs').promises;
const path = require('path');

async function generateFlightCoordinatesJson() {
  // Replace with the correct paths to your JSON files
  const enrichedFlightsPath = path.join('data', 'enriched_flights.json');
  const airportsPath = path.join('data', 'airports.json');
  const outputFilePath = path.join('data', 'flight_coordinates.json');

  try {
    const [enrichedFlights, airports] = await Promise.all([
      fs.readFile(enrichedFlightsPath, 'utf8').then(JSON.parse),
      fs.readFile(airportsPath, 'utf8').then(JSON.parse)
    ]);

    // Create a map for quick lookup of airport latitude and longitude by IATA code
    const airportCoords = airports.reduce((acc, airport) => {
      acc[airport.airportIATA] = { lat: airport.lat, lon: airport.lon };
      return acc;
    }, {});

    // Map over enriched flights to create a new structure including coordinates
    const flightsWithCoords = enrichedFlights.map(flight => ({
      flightNumber: flight.flightNumber,
      originIATA: flight.originIATA,
      originLat: airportCoords[flight.originIATA]?.lat,
      originLon: airportCoords[flight.originIATA]?.lon,
      destinationIATA: flight.destinationIATA,
      destinationLat: airportCoords[flight.destinationIATA]?.lat,
      destinationLon: airportCoords[flight.destinationIATA]?.lon
    }));

    // Write the new JSON structure to a file
    await fs.writeFile(outputFilePath, JSON.stringify(flightsWithCoords, null, 2));
    console.log(`Flight coordinates data written to ${outputFilePath}`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Helper function to calculate age from birthDate
function calculateAge(birthDate) {
  const birthDateObj = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const m = today.getMonth() - birthDateObj.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
    age--;
  }
  return age;
}

// Main function to generate the flight passengers data
async function generateFlightPassengersData() {
  const ticketsDataPath = path.join('data', 'tickets.json');
  const passengersDataPath = path.join('data', 'passengers.json');
  const outputFilePath = path.join('data', 'flight_passengers.json');
  
  try {
    // Make sure the files exist
    await Promise.all([fs.access(ticketsDataPath), fs.access(passengersDataPath)]);

    // Load and parse the tickets and passengers data
    const ticketsData = JSON.parse(await fs.readFile(ticketsDataPath, 'utf-8'));
    const passengersData = JSON.parse(await fs.readFile(passengersDataPath, 'utf-8')).passengers;

    // Create a map for passenger details for quick lookup
    const passengerDetailsMap = new Map();
    passengersData.forEach(passenger => {
      const age = calculateAge(passenger.birthDate.split('/').reverse().join('-'));
      passengerDetailsMap.set(passenger.passengerID, { ...passenger, age });
    });

    // Create a structure to hold the flight passenger data
    const flightPassengers = {};

    // Go through each ticket and organize passengers by flight number
    ticketsData.forEach(ticket => {
      if (!flightPassengers[ticket.flightNumber]) {
        flightPassengers[ticket.flightNumber] = [];
      }
      const passengerDetails = passengerDetailsMap.get(ticket.passengerID);
      if (passengerDetails) {
        flightPassengers[ticket.flightNumber].push({ ...passengerDetails, seatNumber: ticket.seatNumber });
      }
    });

    await fs.writeFile(outputFilePath, JSON.stringify(flightPassengers, null, 2), 'utf-8');
    console.log(`Flight passengers data has been saved to ${outputFilePath}`);
  } catch (error) {
    console.error('Error generating flight passengers data:', error);
  }
}

module.exports = {
    generateFlightCoordinatesJson,
    generateFlightPassengersData
  };
