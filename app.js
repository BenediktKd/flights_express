const express = require('express');
const app = express();
const { listFiles, downloadFlightData, downloadFile , processAircraftsXML, processAirportsCSV,
      processPassengersYAML, processTicketsCSV } = require('./utils/storage');
const { countPassengersPerFlight } = require('./utils/dataCounter');
const {convertBirthDates} = require('./utils/dataFixer')
const path = require('path');
const fs = require('fs').promises;

const aircraftsXMLPath = 'aircrafts.xml';
const airportsCSVFilename = 'airports.csv';

async function downloadAndProcessAircrafts() {
  const aircraftsXMLFilename = 'aircrafts.xml'; // El nombre del archivo en el bucket
  const localXMLPath = path.join('data', aircraftsXMLFilename); // La ruta local donde se guardará el archivo XML

  try {
    // Descarga el archivo XML
    await downloadFile(aircraftsXMLFilename);
    console.log(`Descargado ${aircraftsXMLFilename} a ${localXMLPath}`);

    // Procesa el archivo XML y guarda el resultado como JSON
    await processAircraftsXML(localXMLPath);
    console.log(`El archivo XML ha sido procesado y convertido a JSON.`);

    // Elimina el archivo XML local después de procesarlo
    await fs.promises.unlink(localXMLPath);
    console.log(`El archivo XML ${localXMLPath} ha sido eliminado.`);
  } catch (error) {
    console.error('Error al descargar y procesar aircrafts.xml:', error);
  }
}

async function downloadAndProcessAirportsCSV() {
  const airportsCSVFilename = 'airports.csv'; // El nombre del archivo en el bucket
  const localCSVPath = path.join('data', airportsCSVFilename); // La ruta local donde se guardará el archivo CSV descargado

  try {
    // Descarga el archivo CSV del bucket a la carpeta local 'data'
    await downloadFile(airportsCSVFilename);

    // Procesa el archivo CSV descargado y conviértelo a JSON
    await processAirportsCSV(localCSVPath);

    console.log('El archivo CSV ha sido procesado y guardado como JSON.');
  } catch (error) {
    console.error('Error al descargar y procesar airports.csv:', error);
  }
}


async function downloadAndProcessPassengersYAML() {
  const passengersYAMLFilename = 'passengers.yaml'; // El nombre del archivo en el bucket
  const localYAMLPath = path.join('data', passengersYAMLFilename); // La ruta local donde se guardará el archivo YAML descargado

  try {
    // Descarga el archivo YAML del bucket a la carpeta local 'data'
    await downloadFile(passengersYAMLFilename);

    // Procesa el archivo YAML descargado y conviértelo a JSON
    await processPassengersYAML(localYAMLPath);

    console.log('El archivo passengers.yaml ha sido procesado y guardado como JSON.');
  } catch (error) {
    console.error('Error al descargar y procesar passengers.yaml:', error);
  }
}

async function downloadAndProcessTicketsCSV() {
  const ticketsCSVFilename = 'tickets.csv'; // El nombre del archivo en el bucket
  const localCSVPath = path.join('data', ticketsCSVFilename); // La ruta local donde se guardará el archivo CSV descargado

  try {
    // Descarga el archivo CSV del bucket a la carpeta local 'data'
    await downloadFile(ticketsCSVFilename);

    // Procesa el archivo CSV descargado y conviértelo a JSON
    await processTicketsCSV(localCSVPath);

    console.log('El archivo tickets.csv ha sido procesado y guardado como JSON.');
  } catch (error) {
    console.error('Error al descargar y procesar tickets.csv:', error);
  }
}

async function readFlightData(year, month) {
  const monthFolderPath = path.join('data', 'flights', year.toString(), month.toString().padStart(2, '0'), 'flight_data.json');
  try {
    const data = await fs.readFile(monthFolderPath, 'utf-8');
    const flights = JSON.parse(data);
    // Añade año y mes a cada vuelo
    return flights.map(flight => ({ ...flight, year, month }));
  } catch (error) {
    console.error(`Error al leer los datos de vuelo para ${year}-${month}:`, error);
    return []; // Devuelve un array vacío si no se pudo leer el archivo
  }
}

async function combineAllFlightData() {
  let allFlights = [];

  try {
    const years = await fs.readdir(path.join('data', 'flights')); // Obtener todos los años disponibles de forma asíncrona
    for (const year of years) {
      const months = await fs.readdir(path.join('data', 'flights', year)); // Obtener todos los meses para cada año de forma asíncrona
      for (const month of months) {
        const flightsForMonth = await readFlightData(year, month);
        allFlights = allFlights.concat(flightsForMonth); // Agrega los vuelos al array principal
      }
    }
  
    // Una vez que todos los vuelos se han recopilado, escribe el array en un nuevo archivo JSON
    const combinedFilePath = path.join('data', 'combined_flights.json');
    await fs.writeFile(combinedFilePath, JSON.stringify(allFlights, null, 2), 'utf-8');
    console.log(`Todos los vuelos han sido combinados en ${combinedFilePath}`);
  } catch (error) {
    console.error('Error al combinar los datos de vuelo:', error);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// listFiles();
// __________DESCARGA________________
// downloadFlightData();
// downloadAndProcessAircrafts();
// downloadAndProcessAirportsCSV();
// downloadAndProcessPassengersYAML();
// downloadAndProcessTicketsCSV();
// __________ARREGLO DE DATOS________________
// combineAllFlightData();
// convertBirthDates();
// countPassengersPerFlight();






