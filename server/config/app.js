import express from 'express'
import cors from 'cors'// para ambiente de desenvolvimeto, será configurado futuramente

const app = express()
app.use(cors())
app.use(express.json()) 

// rotas futuramente aqui

export default app