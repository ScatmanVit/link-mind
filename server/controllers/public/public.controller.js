import UserService from "../../services/public/public.routes.js"
import { captalize, findOneUser } from "../../utils/utils.js"
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'

const jwt_secret = process.env.JWT_SECRET

/* Implementar o caso de chegar um google_id */
async function createUserController(req, res) {
   const { name, email, password, google_id } = req.body
   if(google_id){
      if (!name || !email) {
         return res.status(400).json({ 
            message: "Dados não recebidos, por favor preencha todos os campos" 
         })
      }
   } else {
      if (!name || !email || !password) {
         return res.status(400).json({ 
            message: "Dados não recebidos, por favor preencha todos os campos" 
         })
      }
   }

   let hashPassword;
   if (!google_id && password) {
      const salt = await bcrypt.genSalt(10);
      hashPassword = await bcrypt.hash(password, salt);
   }
   
   try {
      const userExist = await findOneUser(email)
      if(userExist){
         return res.status(400).json({ 
            message: "Já existe um usuário cadastrado nesse email" 
         })
      }
      await UserService.createUserService({
         name: name, 
         email: email.replace(/\s+/g, '').toLowerCase(),
         password: hashPassword,
         google_id: google_id
      })
      return res.status(201).json({ 
         message: `Conta criada! Seja muito bem-vindo ${captalize(name)}.`  
      })
   } catch(err) {
      console.error("Ocorreu um erro no servidor, [ CREATE USER ] ", err)
      return res.status(500).json({
         message: "Ocorreu um erro no servidor" 
      })
   }  
}


async function loginUserController(req, res) {
   const { email, password, google_id /* futuramente, colocar aqui platform, para diferenciar o envio do token */ } = req.body
   if(google_id){
      if (!email) {
         return res.status(400).json({ message: "Dados não recebidos, por favor preencha todos os campos" })
      }
   } else {
      if (!email || !password) {
         return res.status(400).json({ message: "Dados não recebidos, por favor preencha todos os campos" })
      }
   }

   try {
      const user = await findOneUser(email)
      if(!user){
         return res.status(400).json({ 
            message: "'E-mail ou senha inválidos, por favor digite novamente" 
         })
      }

      if(!google_id) {
         const isMatch = bcrypt.compare(password, user.password)
         if(!isMatch) {
            return res.status(400).json({
               message: "Senha inválida, por favor digite novamente"
            })
         }
      }

      const access_token = jwt.sign({ 
            id: user.id,
            email: user.email    
         }, jwt_secret, 
         { expiresIn: '1d' }
      )
      const refresh_token = jwt.sign({ 
            id: user.id,
            email: user.email    
         }, jwt_secret, 
         { expiresIn: '7d' }
      )
      res.status(200).json({ 
         message: "Login efetuado com sucesso!",
         access_token,
         refresh_token
      })

   } catch(err) {
      console.error("Ocorreu um erro no servidor, [ LOGIN USER ]", err)
      res.status(500).json({ 
         message: "Ocorreu um erro no servidor"
      })
   }
}

export default {
   createUserController,
   loginUserController
}