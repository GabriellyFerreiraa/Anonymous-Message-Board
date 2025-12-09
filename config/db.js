// configurar dotenv (ya está en server.js, pero lo mantenemos por si acaso)
require("dotenv").config();
const { MongoClient } = require("mongodb");

// Usar DB_TEST si estamos en modo test (para freeCodeCamp), si no, usar DB (principal)
const connectionString = process.env.NODE_ENV === "test" 
    ? process.env.DB_TEST 
    : process.env.DB; 

// Si ninguna variable está definida, lanzamos un error que no sea tan críptico
if (!connectionString) {
    throw new Error("ERROR: La cadena de conexión a MongoDB (DB o DB_TEST) no está definida en las variables de entorno.");
}

class Db {
  constructor() {
    // Usamos la variable determinada anteriormente
    this.client = new MongoClient(connectionString);
  }

  async connect() {
    await this.client.connect();
    this.db = this.client.db("messageboard"); // Usé 'messageboard' como nombre de DB por defecto.
    console.log("Connected to MongoDB successfully");
  }

  // Puedes añadir una función getDb si el controlador la necesita
  getDb() {
    return this.db;
  }
}

module.exports = new Db();