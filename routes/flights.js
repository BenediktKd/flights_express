const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Endpoint para obtener datos de vuelo
router.get('/enriched', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(__dirname, '../data/enriched_flights.json'), 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).send('Error al leer los datos de vuelo');
  }
});

// Puedes agregar más endpoints aquí

module.exports = router;
