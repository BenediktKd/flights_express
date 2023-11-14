const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');
const { parseString } = require('xml2js');
const util = require('util');

const parseStringPromise = util.promisify(parseString); // Convertir parseString en una versión que retorna promesas


const storage = new Storage({ keyFilename: './tarea3-service-key.json' });
const bucket = storage.bucket('2023-2-tarea3');

// Función para listar archivos en el bucket, incluyendo subdirectorios
async function listFiles() {
  try {
    const [files] = await bucket.getFiles({ prefix: 'flights/' }); // Listar solo los archivos dentro de la carpeta 'flights/'
    console.log('Archivos en el bucket:');
    files.forEach(file => {
      console.log(file.name);
    });
  } catch (error) {
    console.error('Error al listar archivos:', error);
  }
}

// Función para descargar un archivo específico
async function downloadFile(filePath) {
    const destination = path.join('data', filePath); // Guardar en una carpeta local 'data'
    
    // Asegúrate de que el directorio de destino existe
    const dir = path.dirname(destination);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  
    const options = { destination };
  
    try {
      await bucket.file(filePath).download(options);
      console.log(`Descargado ${filePath} a ${destination}`);
    } catch (error) {
      console.error(`Error al descargar ${filePath}:`, error);
    }
  }
  
// Función para descargar todos los archivos flight_data.json
async function downloadFlightData() {
  try {
    const [files] = await bucket.getFiles({ prefix: 'flights/' });
    files.forEach(file => {
      if (file.name.endsWith('flight_data.json')) {
        downloadFile(file.name);
      }
    });
  } catch (error) {
    console.error('Error al descargar archivos de flight_data:', error);
  }
}

// Función para procesar el archivo aircrafts.xml
// Función para procesar el archivo aircrafts.xml y convertirlo a JSON
async function processAircraftsXML(filePath) {
    try {
      const xml = await fs.promises.readFile(filePath, 'utf-8');
      const result = await parseStringPromise(xml);
    
      // Verifica si la estructura del objeto result es la esperada
      // Cambiando result.root.row por result.aircrafts.row según la estructura del XML proporcionado
      if (result.aircrafts && result.aircrafts.row) {
        const aircrafts = result.aircrafts.row.map(aircraft => ({
          aircraftID: aircraft.aircraftID[0],
          name: aircraft.name[0],
          aircraftType: aircraft.aircraftType[0]
        }));
  
        // Define el archivo de salida JSON
        const jsonFilePath = path.join('data', 'aircrafts.json');
  
        // Escribe el resultado procesado en un archivo JSON
        await fs.promises.writeFile(jsonFilePath, JSON.stringify(aircrafts, null, 2), 'utf-8');
        console.log(`Procesado y guardado como JSON en ${jsonFilePath}`);
      } else {
        console.error('La estructura del objeto result no contiene la propiedad aircrafts.row esperada.');
      }
    } catch (error) {
      console.error('Error al procesar aircrafts.xml:', error);
    }
  }
  
  
  
  module.exports = { storage, bucket, listFiles, downloadFile, downloadFlightData, processAircraftsXML };
