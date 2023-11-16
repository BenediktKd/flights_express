const path = require('path');
const fs = require('fs').promises;

async function calculateTotalDistancePerMonth() {
  const enrichedFlightsFilePath = path.join('data', 'enriched_flights.json');
  
  try {
    // Read and parse the enriched flights data
    const enrichedFlightsData = JSON.parse(await fs.readFile(enrichedFlightsFilePath, 'utf-8'));

    // Object to store total distance per month
    const totalDistancePerMonth = {};

    // Calculate total distance for each month
    enrichedFlightsData.forEach(flight => {
      const yearMonth = `${flight.year}-${flight.month}`;
      const distance = parseFloat(flight.distance);

      if (!totalDistancePerMonth[yearMonth]) {
        totalDistancePerMonth[yearMonth] = 0;
      }
      totalDistancePerMonth[yearMonth] += isNaN(distance) ? 0 : distance;
    });

    // Convert the data to an array of objects for each month
    const totalDistanceArray = Object.entries(totalDistancePerMonth).map(([yearMonth, distance]) => {
      const [year, month] = yearMonth.split('-');
      return { year, month, totalDistance: distance.toFixed(2) };
    });

    // Write the result to a new file
    const graphicsFilePath = path.join('data', 'graphics1.json');
    await fs.writeFile(graphicsFilePath, JSON.stringify(totalDistanceArray, null, 2), 'utf-8');
    console.log(`Total distance per month has been saved in ${graphicsFilePath}`);
  } catch (error) {
    console.error('Error calculating total distance per month:', error);
  }
}

async function calculateTotalWeightPerFlight() {
    const flightPassengersFilePath = path.join('data', 'flight_passengers.json');
    
    // Leer y analizar el archivo de pasajeros de vuelo
    const flightPassengersData = JSON.parse(await fs.readFile(flightPassengersFilePath, 'utf-8'));
  
    // Objeto para almacenar el peso total por vuelo
    const totalWeightPerFlight = {};
  
    // Calcular el peso total para cada vuelo
    for (const [flightNumber, passengers] of Object.entries(flightPassengersData)) {
      totalWeightPerFlight[flightNumber] = passengers.reduce((total, passenger) => {
        return total + (parseFloat(passenger['weight(kg)']) || 0);
      }, 0);
    }
  
    return totalWeightPerFlight;
  }

  async function calculateAverageHeightPerFlight() {
    const flightPassengersFilePath = path.join('data', 'flight_passengers.json');
    
    // Leer y analizar el archivo de pasajeros de vuelo
    const flightPassengersData = JSON.parse(await fs.readFile(flightPassengersFilePath, 'utf-8'));
  
    // Objeto para almacenar la altura promedio por vuelo
    const averageHeightPerFlight = {};
  
    // Calcular la altura promedio para cada vuelo
    for (const [flightNumber, passengers] of Object.entries(flightPassengersData)) {
      const totalHeight = passengers.reduce((total, passenger) => {
        return total + (parseFloat(passenger['height(cm)']) || 0);
      }, 0);
      const averageHeight = passengers.length > 0 ? totalHeight / passengers.length : 0;
      averageHeightPerFlight[flightNumber] = averageHeight;
    }
  
    return averageHeightPerFlight;
  }
  
async function addTotalWeightToGraphics() {
    const enrichedFlightsFilePath = path.join('data', 'enriched_flights.json');
    const graphicsFilePath = path.join('data', 'graphics1.json');
  
    // Calcular el peso total por vuelo
    const totalWeightPerFlight = await calculateTotalWeightPerFlight();
  
    // Leer y analizar los datos de vuelos enriquecidos
    const enrichedFlightsData = JSON.parse(await fs.readFile(enrichedFlightsFilePath, 'utf-8'));
  
    // Objeto para almacenar el peso total por año y mes
    const totalWeightPerMonth = {};
  
    // Sumar el peso por año y mes
    enrichedFlightsData.forEach(flight => {
      const yearMonth = `${flight.year}-${flight.month}`;
      const weight = totalWeightPerFlight[flight.flightNumber] || 0;
  
      if (!totalWeightPerMonth[yearMonth]) {
        totalWeightPerMonth[yearMonth] = { totalWeight: 0, totalDistance: 0 };
      }
      totalWeightPerMonth[yearMonth].totalWeight += weight;
    });
  
    // Leer y actualizar los datos en graphics1.json
    const graphicsData = JSON.parse(await fs.readFile(graphicsFilePath, 'utf-8'));
    graphicsData.forEach(item => {
      const yearMonth = `${item.year}-${item.month}`;
      if (totalWeightPerMonth[yearMonth]) {
        item.totalWeight = totalWeightPerMonth[yearMonth].totalWeight.toFixed(2);
      }
    });
  
    // Escribir los datos actualizados en graphics1.json
    await fs.writeFile(graphicsFilePath, JSON.stringify(graphicsData, null, 2), 'utf-8');
    console.log(`graphics1.json has been updated with total weight information.`);
  }

  async function addAverageHeightToGraphics() {
    const enrichedFlightsFilePath = path.join('data', 'enriched_flights.json');
    const graphicsFilePath = path.join('data', 'graphics1.json');
  
    // Calcular la altura promedio por vuelo
    const averageHeightPerFlight = await calculateAverageHeightPerFlight();
  
    // Leer y analizar los datos de vuelos enriquecidos
    const enrichedFlightsData = JSON.parse(await fs.readFile(enrichedFlightsFilePath, 'utf-8'));
  
    // Objeto para almacenar la altura promedio por año y mes
    const averageHeightPerMonth = {};
  
    // Sumar la altura promedio por año y mes
    enrichedFlightsData.forEach(flight => {
      const yearMonth = `${flight.year}-${flight.month}`;
      const height = averageHeightPerFlight[flight.flightNumber] || 0;
  
      if (!averageHeightPerMonth[yearMonth]) {
        averageHeightPerMonth[yearMonth] = { totalHeight: 0, flightCount: 0 };
      }
      averageHeightPerMonth[yearMonth].totalHeight += height;
      averageHeightPerMonth[yearMonth].flightCount++;
    });
  
    // Leer y actualizar los datos en graphics1.json
    const graphicsData = JSON.parse(await fs.readFile(graphicsFilePath, 'utf-8'));
    graphicsData.forEach(item => {
      const yearMonth = `${item.year}-${item.month}`;
      if (averageHeightPerMonth[yearMonth]) {
        const totalHeight = averageHeightPerMonth[yearMonth].totalHeight;
        const flightCount = averageHeightPerMonth[yearMonth].flightCount;
        item.averageHeight = (totalHeight / flightCount).toFixed(2);
      }
    });
  
    // Escribir los datos actualizados en graphics1.json
    await fs.writeFile(graphicsFilePath, JSON.stringify(graphicsData, null, 2), 'utf-8');
    console.log(`graphics1.json has been updated with average height information.`);
  }




module.exports = {
    calculateTotalDistancePerMonth,
    addTotalWeightToGraphics,
    addAverageHeightToGraphics
  };