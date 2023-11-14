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

  module.exports = {
    countPassengersPerFlight
  };