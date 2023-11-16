const path = require('path');
const fs = require('fs').promises;

async function calculateTotalFlightsPerAirline() {
    const enrichedFlightsFilePath = path.join('data', 'enriched_flights.json');
    const graphics2FilePath = path.join('data', 'graphics2.json');

    try {
        // Leer y analizar los datos de vuelos enriquecidos
        const enrichedFlightsData = JSON.parse(await fs.readFile(enrichedFlightsFilePath, 'utf-8')); // Corregido aquí

        // Objeto para almacenar el recuento total de vuelos por aerolínea y año
        const totalFlightsPerAirline = {};

        // Contar los vuelos para cada aerolínea y año
        enrichedFlightsData.forEach(flight => {
            const year = flight.year;
            const airline = flight.airline;

            if (!totalFlightsPerAirline[year]) {
                totalFlightsPerAirline[year] = {};
            }
            if (!totalFlightsPerAirline[year][airline]) {
                totalFlightsPerAirline[year][airline] = 0;
            }
            totalFlightsPerAirline[year][airline] += 1;
        });

        // Escribir los resultados en el archivo graphics2.json
        await fs.writeFile(graphics2FilePath, JSON.stringify(totalFlightsPerAirline, null, 2), 'utf-8'); // Corregido aquí
        console.log(`Total flights per airline per year has been saved in ${graphics2FilePath}`);
    } catch (error) {
        console.error('Error calculating total flights per airline:', error);
    }
}

module.exports = {
    calculateTotalFlightsPerAirline
};

