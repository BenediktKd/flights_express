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

module.exports = {
    generateFlightCoordinatesJson
  };
