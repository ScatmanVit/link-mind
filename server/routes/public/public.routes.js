import AuthControllers from '../../controllers/public/auth.controller.js'
import Route from 'express'
const route = Route()

route.post('/auth/cadastro', AuthControllers.createUserController)
route.post('/auth/login', AuthControllers.loginUserController)

export default route