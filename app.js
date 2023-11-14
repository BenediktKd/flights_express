const express = require('express');
const app = express();
const { listFiles, downloadFlightData, downloadFile , processAircraftsXML } = require('./utils/storage');
const path = require('path');

const aircraftsXMLPath = 'aircrafts.xml';


async function downloadAndProcessAircrafts() {
    const aircraftsXMLFilename = 'aircrafts.xml'; // El nombre del archivo en el bucket
    const localXMLPath = path.join(__dirname, 'data', aircraftsXMLFilename); // La ruta local donde se guardará el archivo
  
    try {
      console.log(`Iniciando la descarga de ${aircraftsXMLFilename}...`);
      await downloadFile(aircraftsXMLFilename); // Descarga el archivo XML
      console.log(`Descargado ${aircraftsXMLFilename} a ${localXMLPath}`);
      console.log(`Iniciando el procesamiento de ${localXMLPath}...`);
      await processAircraftsXML(localXMLPath); // Procesa el archivo y guarda el resultado como JSON
    } catch (error) {
      console.error('Error al descargar y procesar aircrafts.xml:', error);
    }
  }

// Aquí puedes añadir tus rutas y middleware

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// listFiles();
// downloadFlightData();

downloadAndProcessAircrafts();



