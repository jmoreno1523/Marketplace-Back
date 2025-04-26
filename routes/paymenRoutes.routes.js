const express = require('express');
const router = express.Router();
const {validatePayment, getCompras, getTodasCompras, estadisticas, actualizarEstado} = require('./controllers/payment.js');

router.post('/validatePayment', validatePayment);
router.post('/getCompras', getCompras);
router.get('/getTodasCompras', getTodasCompras);
router.get('/estadisticas', estadisticas)
router.put('/actualizarEstado', actualizarEstado)


module.exports = router;