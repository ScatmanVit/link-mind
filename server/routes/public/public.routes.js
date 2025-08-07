import PublicControllers from '../../controllers/public/public.controller.js'
import Route from 'express'
const route = Route()

route.post('/cadastro', PublicControllers.createUserController)
route.post('/login', PublicControllers.loginUserController)

export default route