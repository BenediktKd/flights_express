const path = require('path');
const fs = require('fs').promises;

function getAgeGroup(age) {
    if (age <= 4) return '0-4';
    if (age <= 9) return '5-9';
    if (age <= 14) return '10-14';
    if (age <= 19) return '15-19';
    if (age <= 24) return '20-24';
    if (age <= 29) return '25-29';
    if (age <= 34) return '30-34';
    if (age <= 39) return '35-39';
    if (age <= 44) return '40-44';
    if (age <= 49) return '45-49';
    if (age <= 54) return '50-54';
    if (age <= 59) return '55-59';
    if (age <= 64) return '60-64';
    if (age <= 69) return '65-69';
    if (age <= 74) return '70-74';
    return '75+';
}

function calculatePercentages(data) {
    const percentages = {};

    for (const year in data) {
        percentages[year] = {};
        let total = 0;

        for (const ageGroup in data[year]) {
            total += data[year][ageGroup].male + data[year][ageGroup].female;
        }

        for (const ageGroup in data[year]) {
            const count = data[year][ageGroup].male + data[year][ageGroup].female;
            percentages[year][ageGroup] = (count / total) * 100;
        }
    }

    return percentages;
}

async function calculateAgeGroupsPerYear() {
    const enrichedFlightsFilePath = path.join('data', 'enriched_flights.json');
    const flightPassengersFilePath = path.join('data', 'flight_passengers.json');
    const graphics3FilePath = path.join('data', 'graphics3.json');

    try {
        const enrichedFlightsData = JSON.parse(await fs.readFile(enrichedFlightsFilePath, 'utf-8'));
        const flightPassengersData = JSON.parse(await fs.readFile(flightPassengersFilePath, 'utf-8'));

        const ageGroupsPerYear = {};

        // Recorrer los vuelos enriquecidos y contabilizar pasajeros por grupo de edad y género
        enrichedFlightsData.forEach(flight => {
            const year = flight.year;
            const passengers = flightPassengersData[flight.flightNumber];

            if (passengers) {
                passengers.forEach(passenger => {
                    const ageGroup = getAgeGroup(passenger.age);
                    const gender = passenger.gender.toLowerCase();

                    if (!ageGroupsPerYear[year]) {
                        ageGroupsPerYear[year] = initializeAgeGroups();
                    }
                    if (!ageGroupsPerYear[year][ageGroup]) {
                        ageGroupsPerYear[year][ageGroup] = { male: 0, female: 0 };
                    }
                    ageGroupsPerYear[year][ageGroup][gender]++;
                });
            }
        });

        // Escribir los resultados en el archivo graphics3.json
        await fs.writeFile(graphics3FilePath, JSON.stringify(ageGroupsPerYear, null, 2), 'utf-8');
        console.log('Age groups per year have been saved in graphics3.json');
    } catch (error) {
        console.error('Error calculating age groups per year:', error);
    }
}

// Inicializar todos los grupos de edad con conteos de género en cero
function initializeAgeGroups() {
    const ageGroups = {};
    const ageRanges = ['0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74', '75+'];

    ageRanges.forEach(range => {
        ageGroups[range] = { male: 0, female: 0 };
    });

    return ageGroups;
}



async function calculateGenderCountsPerYear() {
    const enrichedFlightsFilePath = path.join('data', 'enriched_flights.json');
    const flightPassengersFilePath = path.join('data', 'flight_passengers.json');
    const graphics3FilePath = path.join('data', 'graphics3.json');

    try {
        // Leer y analizar los datos de vuelos enriquecidos y pasajeros
        const enrichedFlightsData = JSON.parse(await fs.readFile(enrichedFlightsFilePath, 'utf-8'));
        const flightPassengersData = JSON.parse(await fs.readFile(flightPassengersFilePath, 'utf-8'));

        // Objeto para almacenar el recuento de género por año
        const genderCountsPerYear = {};

        // Recorrer los vuelos enriquecidos y contar géneros
        enrichedFlightsData.forEach(flight => {
            const year = flight.year;
            const flightNumber = flight.flightNumber;

            if (!genderCountsPerYear[year]) {
                genderCountsPerYear[year] = { male: 0, female: 0 };
            }

            const passengers = flightPassengersData[flightNumber] || [];
            passengers.forEach(passenger => {
                if (passenger.gender === 'male') {
                    genderCountsPerYear[year].male += 1;
                } else if (passenger.gender === 'female') {
                    genderCountsPerYear[year].female += 1;
                }
            });
        });

        // Escribir los resultados en el archivo graphics3.json
        await fs.writeFile(graphics3FilePath, JSON.stringify(genderCountsPerYear, null, 2), 'utf-8');
        console.log(`Gender counts per year have been saved in ${graphics3FilePath}`);
    } catch (error) {
        console.error('Error calculating gender counts per year:', error);
    }
}

module.exports = {
    calculateAgeGroupsPerYear
};

