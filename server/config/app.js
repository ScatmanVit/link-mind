import PublicRoutes from '../routes/public/public.routes.js'
import cookieParser from 'cookie-parser';
import express from 'express'
import cors from 'cors'// para ambiente de desenvolvimeto, será configurado futuramente

const app = express()

app.use(cookieParser())
app.use(cors())
app.use(express.json()) 
// rotas futuramente aqui
app.use('/linkmind', PublicRoutes)

export default app