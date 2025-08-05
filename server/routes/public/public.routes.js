import UserController from '../../controllers/public/public.controller.js'
import Route from 'express'
const route = Route()

route.post('/cadastro', UserController.createUserController)

export default route