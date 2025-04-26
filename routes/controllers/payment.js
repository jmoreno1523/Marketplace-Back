const pool = require('../../db/mongo.js');
const moment = require('moment-timezone');
const { ObjectId } = require('mongodb');


const validatePayment = async (req, res) => {
    const { userId, valor, producto, nombre, cedula, telefono, datosTarjeta } = req.body;

    const tarjetaPredefinida = {
        numero: "9858658998562541",
        fecha: "12/29",
        cvv: "596" 
    };

    const estado = (
        String(datosTarjeta.numero) === tarjetaPredefinida.numero &&
        String(datosTarjeta.fecha) === tarjetaPredefinida.fecha &&
        String(datosTarjeta.cvv) === tarjetaPredefinida.cvv
    ) ? "Aceptado" : "Rechazado";

    try {
        const currentDateTime = moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss');
        await pool.db('marketplace').collection('compras').insertOne({ 
            userId: new ObjectId(userId), 
            fecha: currentDateTime, 
            valor, 
            producto, 
            estado, 
            nombre, 
            cedula, 
            telefono, 
            datosTarjeta 
        });
        res.json({ status: "Pago realizado", estado , fecha: currentDateTime, producto, valor });
    } catch (error) {
        console.error('Error al procesar el pago:', error);
        res.status(500).json({ status: "Error", message: "Internal Server Error" });
    }
}

const getCompras = async (req, res) => {
    const { userId } = req.body;
    try {
        const compras = await pool.db('marketplace').collection('compras').find({ userId: new ObjectId(userId) }).toArray();
        res.json(compras);
    } catch (error) {
        console.error('Error al obtener las compras:', error);
        res.status(500).json({ status: "Error", message: "Internal Server Error" });
    }
}

const getTodasCompras = async (req, res) => {
    try {
        const compras = await pool.db('marketplace').collection('compras').aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: '$userDetails'
            },
            {
                $project: {
                    fecha: 1,
                    valor: 1,
                    producto: 1,
                    estado: 1,
                    userEmail: '$userDetails.email'
                }
            }
        ]).toArray();

        res.json(compras);
    } catch (error) {
        console.error('Error al obtener todas las compras:', error);
        res.status(500).json({ status: "Error", message: "Internal Server Error" });
    }
}

const actualizarEstado = async (req, res) => {
    const { compraId, nuevoEstado } = req.body;

    try {
        const result = await pool.db('marketplace').collection('compras').updateOne(
            { _id: new ObjectId(compraId) },  // Filtro: compra por ID
            { $set: { estado: nuevoEstado } }  // Actualiza el estado
        );

        if (result.modifiedCount > 0) {
            res.json({ status: "Success", message: "Estado actualizado correctamente" });
        } else {
            res.status(404).json({ status: "Error", message: "Compra no encontrada" });
        }
    } catch (error) {
        console.error('Error al actualizar el estado:', error);
        res.status(500).json({ status: "Error", message: "Error al actualizar el estado" });
    }
};

const estadisticas = async (req, res) => {
    try {
        const db = pool.db('marketplace');

        // Total de ventas
        const totalVentas = await db.collection('compras').aggregate([
            { $group: { _id: null, total: { $sum: { $toDouble: "$valor" } } } }
        ]).toArray();

        // Compras aceptadas y rechazadas
        const comprasPorEstado = await db.collection('compras').aggregate([
            { $group: { _id: "$estado", cantidad: { $sum: 1 } } }
        ]).toArray();

        // Productos más vendidos
        const productosMasVendidos = await db.collection('compras').aggregate([
            { $group: { _id: "$producto", cantidad: { $sum: 1 } } },
            { $sort: { cantidad: -1 } },
            { $limit: 5 }
        ]).toArray();

        res.json({
            totalVentas: totalVentas[0]?.total || 0,
            comprasPorEstado,
            productosMasVendidos
        });
    } catch (error) {
        console.error("Error al obtener estadísticas:", error);
        res.status(500).json({ status: "Error", message: "Internal Server Error" });
    }
};



module.exports = { validatePayment, getCompras, getTodasCompras, actualizarEstado, estadisticas };
