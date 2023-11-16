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

async function calculateTicketTypesPerAirline() {
    const enrichedFlightsFilePath = path.join('data', 'enriched_flights.json');
    const ticketsFilePath = path.join('data', 'tickets.json');
    const graphics2FilePath = path.join('data', 'graphics2.json');

    try {
        // Leer y analizar los datos de tickets y vuelos enriquecidos
        const ticketsData = JSON.parse(await fs.readFile(ticketsFilePath, 'utf-8'));
        const enrichedFlightsData = JSON.parse(await fs.readFile(enrichedFlightsFilePath, 'utf-8'));

        // Crear un mapeo de número de vuelo a aerolínea y año
        const flightToAirlineYearMap = enrichedFlightsData.reduce((map, flight) => {
            map[flight.flightNumber] = { airline: flight.airline, year: flight.year };
            return map;
        }, {});

        // Objeto para almacenar los tipos de boletos por aerolínea y año
        const ticketTypesPerAirline = {};

        // Contabilizar los tipos de boletos para cada aerolínea y año
        ticketsData.forEach(ticket => {
            const flightInfo = flightToAirlineYearMap[ticket.flightNumber];
            if (flightInfo) {
                const { airline, year } = flightInfo;
                const flightType = ticket.flightType;

                if (!ticketTypesPerAirline[year]) {
                    ticketTypesPerAirline[year] = {};
                }
                if (!ticketTypesPerAirline[year][airline]) {
                    ticketTypesPerAirline[year][airline] = {};
                }
                if (!ticketTypesPerAirline[year][airline][flightType]) {
                    ticketTypesPerAirline[year][airline][flightType] = 0;
                }
                ticketTypesPerAirline[year][airline][flightType] += 1;
            }
        });

        // Escribir los resultados en el archivo graphics2.json
        await fs.writeFile(graphics2FilePath, JSON.stringify(ticketTypesPerAirline, null, 2), 'utf-8');
        console.log(`Ticket types per airline per year has been saved in ${graphics2FilePath}`);
    } catch (error) {
        console.error('Error calculating ticket types per airline:', error);
    }
}




module.exports = {
    calculateTotalFlightsPerAirline,
    calculateTicketTypesPerAirline
};

