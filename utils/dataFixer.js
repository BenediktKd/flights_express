const fs = require('fs').promises;
const path = require('path');

// Función para convertir el nombre del mes a número
const monthToNumber = (monthName) => {
  const months = {
    enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
    julio: '07', agosto: '08', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12'
  };
  return months[monthName.toLowerCase()];
};

// Función para formatear la fecha de nacimiento
const formatBirthDate = (birthDate) => {
  const parts = birthDate.match(/(\d+) de (\w+) de (\d+)/);
  if (!parts) {
    throw new Error(`Fecha de nacimiento '${birthDate}' no tiene el formato esperado.`);
  }

  const day = parts[1].padStart(2, '0');
  const month = monthToNumber(parts[2]);
  const year = parts[3];

  return `${day}/${month}/${year}`;
};

// Función para leer y convertir las fechas de nacimiento en passengers.json
const convertBirthDates = async () => {
  const passengersFilePath = path.join('data', 'passengers.json');
  const passengersData = JSON.parse(await fs.readFile(passengersFilePath, 'utf-8'));

  passengersData.passengers.forEach(passenger => {
    try {
      passenger.birthDate = formatBirthDate(passenger.birthDate);
    } catch (error) {
      console.error(`Error al convertir la fecha de nacimiento para el pasajero ${passenger.passengerID}:`, error);
    }
  });

  await fs.writeFile(passengersFilePath, JSON.stringify(passengersData, null, 2), 'utf-8');
  console.log('Las fechas de nacimiento han sido convertidas y guardadas.');
};

module.exports = {
    convertBirthDates
  };