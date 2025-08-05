import UserService from '../../services/public/public.routes.js'
import captalize from "../../utils/utils.js"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

/* Implementar o caso de chegar um google_id */
async function createUserController(req, res) {
   const { name, email, password, google_id, type = "normal" } = req.body
   if(type == "google"){
      if (!name || !email) {
         return res.status(400).json({ message: "Dados não recebidos, por favor preencha todos os campos", type })
      }
   } else {
      if (!name || !email || !password) {
         return res.status(400).json({ message: "Dados não recebidos, por favor preencha todos os campos", type })
      }
   }

   let hashPassword
   const salt = await bcrypt.genSalt(10);
   if(type !== "google") {
      if(password !== undefined) {
         hashPassword = await bcrypt.hash(password, salt);
      }
   }
   
   try {
      const userExist = await findOneUser(email)
      if(userExist){
         return res.status(400).json({ message: "Já existe um usuário cadastrado nesse email" })
      }
      await UserService.createUserService({
         name: name, 
         email: email.replace(/\s+/g, '').toLowerCase(),
         password: hashPassword,
         google_id: google_id
      })
      return res.status(201).json({ message: `Conta criada! Seja muito bem-vindo ${captalize(name)}.`  })
   } catch(err) {
      console.error("Ocorreu um erro no servidor, [ CREATE USER ] ", err)
      return res.status(500).json({ message: "Ocorreu um erro no servidor" })
   }  
}

export default {
   createUserController
}