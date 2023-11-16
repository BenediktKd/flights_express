const express = require('express');
const app = express();
const { listFiles, downloadFlightData, downloadFile , processAircraftsXML, processAirportsCSV,
      processPassengersYAML, processTicketsCSV } = require('./utils/storage');
const { countPassengersPerFlight, addAircraftNamesToFlights, addPassengerCountsToFlights, addAverageAgeToFlights,
   addDistancesToFlights, enrichFlightsWithCityNames} = require('./utils/dataCounter');
const {generateFlightCoordinatesJson, generateFlightPassengersData} = require('./utils/dataMaper');
const {convertBirthDates} = require('./utils/dataFixer')
const {calculateTotalDistancePerMonth, addTotalWeightToGraphics, addAverageHeightToGraphics} =require('./utils/graphics')
const {calculateTotalFlightsPerAirline, calculateTicketTypesPerAirline} = require('./utils/graphics2')
const {calculateAgeGroupsPerYear} = require('./utils/graphics3')
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

// Define una función asincrónica que realiza todas las descargas y procesamientos en secuencia
async function downloadAndProcessData() {
  try {
    // Llama a las funciones de descarga y procesamiento una después de la otra
    await listFiles();
    await downloadFlightData();
    await downloadAndProcessAircrafts();
    await downloadAndProcessAirportsCSV();
    await downloadAndProcessPassengersYAML();
    await downloadAndProcessTicketsCSV();

    

    

    

   
s
    


    console.log('Todas las descargas y procesamientos han sido completados.');
  } catch (error) {
    console.error('Error en la secuencia de descargas y procesamientos:', error);
  }
}

// Define una función asincrónica para procesar datos adicionales
async function processAdditionalData() {
  try {
    // Combina los datos de vuelo
    await combineAllFlightData();
    
    // Convierte las fechas de nacimiento
    await convertBirthDates();
    
    // Cuenta los pasajeros por vuelo
    await countPassengersPerFlight();
    
    // Agrega nombres de aeronaves a los vuelos
    await addAircraftNamesToFlights();

    await addPassengerCountsToFlights();

    await addAverageAgeToFlights();

    await addDistancesToFlights();

    await enrichFlightsWithCityNames();

    await generateFlightCoordinatesJson();

    await generateFlightPassengersData();

    await calculateTotalDistancePerMonth();

    await addTotalWeightToGraphics();

    await addAverageHeightToGraphics();

    await calculateTotalFlightsPerAirline();

    await calculateTicketTypesPerAirline();

    await calculateAgeGroupsPerYear();

    


    console.log('Todas las tareas adicionales han sido completadas.');
  } catch (error) {
    console.error('Error en la secuencia de tareas adicionales:', error);
  }
}

// Llama a la función que inicia todo el proceso principal
downloadAndProcessData()
  .then(() => {
    // Una vez que se completan las tareas principales, llama a las tareas adicionales
    processAdditionalData();
  })
  .catch(error => {
    console.error('Error durante la inicialización:', error);
  });


// Middleware to serve static files from the 'public' directory
app.use(express.static('public'));

// Endpoint to serve enriched flights JSON data
app.get('/api/enriched-flights', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'data', 'enriched_flights.json'), 'utf-8');
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    } catch (error) {
        console.error('Error serving enriched flights:', error);
        res.status(500).send('Error serving enriched flights');
    }
});

// Endpoint to serve flight coordinates JSON data based on flight number
app.get('/api/flight-coordinates/:flightNumber', async (req, res) => {
  try {
      // Get the flight number from the request parameters
      const flightNumber = req.params.flightNumber;

      // Read the flight coordinates data from the JSON file
      const filePath = path.join(__dirname, 'data', 'flight_coordinates.json');
      const data = await fs.readFile(filePath, 'utf-8');
      const flightCoordinates = JSON.parse(data);

      // Find the coordinates for the given flight number
      const flight = flightCoordinates.find(flight => flight.flightNumber === flightNumber);

      if (flight) {
          // Construct an object with only the required properties
          const coordinates = {
              originLat: flight.originLat,
              originLon: flight.originLon,
              destinationLat: flight.destinationLat,
              destinationLon: flight.destinationLon
          };

          res.setHeader('Content-Type', 'application/json');
          res.send(coordinates);
      } else {
          // If no flight found, send a 404 response
          res.status(404).send('Flight coordinates not found');
      }
  } catch (error) {
      console.error('Error serving flight coordinates:', error);
      res.status(500).send('Error serving flight coordinates');
  }
});

app.get('/api/airports', async (req, res) => {
  try {
      const data = await fs.readFile(path.join(__dirname, 'data', 'airports.json'), 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      res.send(data);
  } catch (error) {
      console.error('Error serving airports data:', error);
      res.status(500).send('Error serving airports data');
  }
});

// Endpoint to get passengers by flight number
app.get('/api/flight-passengers/:flightNumber', async (req, res) => {
  const flightNumber = req.params.flightNumber;
  const flightPassengersPath = path.join(__dirname, 'data', 'flight_passengers.json');
  
  try {
    // Lee el archivo JSON que contiene los datos de los pasajeros
    const data = await fs.readFile(flightPassengersPath, 'utf8');
    const passengers = JSON.parse(data);

    // Busca los pasajeros para el número de vuelo proporcionado
    const passengersArray = passengers[flightNumber];
    if (!passengersArray) {
      // Si no se encuentran pasajeros para el número de vuelo, envía un estado 404
      return res.status(404).json({ message: `Flight number ${flightNumber} not found` });
    }

    // Si se encuentran pasajeros, envía los datos de los pasajeros
    res.json(passengersArray);
  } catch (error) {
    // Si ocurre algún error durante la lectura del archivo o el procesamiento, envía un estado 500
    console.error('Error fetching flight passengers:', error);
    res.status(500).json({ message: `Internal server error: ${error.message}` });
  }
});

// Endpoint to serve graphics1 JSON data
app.get('/api/graphics1', async (req, res) => {
  try {
      const data = await fs.readFile(path.join(__dirname, 'data', 'graphics1.json'), 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      res.send(data);
  } catch (error) {
      console.error('Error serving graphics1 data:', error);
      res.status(500).send('Error serving graphics1 data');
  }
});

app.get('/api/graphics2', async (req, res) => {
  try {
      // Define la ruta al archivo graphics2.json
      const filePath = path.join(__dirname, 'data', 'graphics2.json');

      // Lee y envía el contenido del archivo graphics2.json
      const data = await fs.readFile(filePath, 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      res.send(data);
  } catch (error) {
      // Maneja cualquier error que ocurra durante la lectura del archivo
      console.error('Error serving graphics2 data:', error);
      res.status(500).send('Error serving graphics2 data');
  }
});

// Endpoint to serve graphics3 JSON data (age groups per year)
app.get('/api/graphics3', async (req, res) => {
  try {
      // Define la ruta al archivo graphics3.json
      const filePath = path.join(__dirname, 'data', 'graphics3.json');

      // Lee y envía el contenido del archivo graphics3.json
      const data = await fs.readFile(filePath, 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      res.send(data);
  } catch (error) {
      // Maneja cualquier error que ocurra durante la lectura del archivo
      console.error('Error serving graphics3 data:', error);
      res.status(500).send('Error serving graphics3 data');
  }
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
