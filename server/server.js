import app from './config/app.js'
import dotenv from 'dotenv'
dotenv.config()

const port = process.env.PORT

app.listen(port, () => console.log("Servidor rodando.."))