const pool  = require('../../db/mongo');
const moment = require('moment-timezone');

//---------------Login---------------------

const validateCredentials = async (req, res) => {
    const datos = req.body;
    //console.log("LOGIN: ", datos);
    try{
      const login =  await pool.db('marketplace').collection('users').findOne({ email: datos.email, pass: datos.password });
      if (login) {
       
        res.json({ status: "Bienvenido", user: datos.email, role: login.role, _id: login._id, nombre: login.nombre});
      } else {
        res.json({ status: "ErrorCredenciales" });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ status: "Error", message: "Internal Server Error" });
    }
  };

  const Signup = async (req, res) => {
    const datos = req.body;
    
    try {
        const userFind = await pool.db('marketplace').collection('users').findOne({ email: datos.email });
        if (userFind) {
            res.status(409).json({ message: `El usuario con el correo: ${datos.email} ya está creado` });
        } else {
            await pool.db('marketplace').collection('users').insertOne({ nombre: datos.username, email: datos.email, pass: datos.password, role: datos.role });
            res.status(201).json({ message: `Usuario creado exitosamente` });
        }
    } catch (error) {
        console.error('Error al crear el usuario:', error);
        res.status(500).json({ message: 'Error al crear el usuario' });
    }
  }

  

  module.exports = { validateCredentials, Signup };