const express = require('express');
const app = express();
const { listFiles, downloadFlightData, downloadFile , processAircraftsXML, processAirportsCSV,
processPassengersYAML, processTicketsCSV } = require('./utils/storage');
const path = require('path');

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



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// listFiles();
downloadFlightData();
downloadAndProcessAircrafts();
downloadAndProcessAirportsCSV();
downloadAndProcessPassengersYAML();
downloadAndProcessTicketsCSV();



