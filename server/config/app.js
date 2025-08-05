import express from 'express'
import cors from 'cors'// para ambiente de desenvolvimeto, será configurado futuramente
import PublicRoutes from '../routes/public/public.routes.js'

const app = express()
app.use(cors())
app.use(express.json()) 

// rotas futuramente aqui
app.use('/link-mind', PublicRoutes)

export default app