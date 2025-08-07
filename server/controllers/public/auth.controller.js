import UserService from "../../services/public/public.routes.js"
import redis from '../../config/redis.js'
import { captalize, findOneUser, formatEmail, verifyGoogleToken, isValidJwt } from "../../utils/utils.js"
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'


const jwt_secret = process.env.JWT_SECRET

/* Implementar o caso de chegar um google_id */
async function createUserController(req, res) {
   const { name, email, password, google_id, id_token } = req.body
   
    if (google_id) {
      if (!id_token) {
         return res.status(400).json({ 
            message: "ID Token Google obrigatório" 
         });
      }
      const payload_google = await verifyGoogleToken(id_token);
      if (!payload_google || payload_google.sub !== google_id) {
         return res.status(401).json({ 
            message: "Identificador Google inválido" 
         });
      }
      if (!name || !email) {
         return res.status(400).json({ 
            message: "Dados não recebidos, por favor preencha todos os campos" 
         });
      }
   } else {
      if (!name || !email || !password) {
         return res.status(400).json({ 
            message: "Dados não recebidos, por favor preencha todos os campos" 
         });
      }
   }

   let hashPassword;
   if (!google_id && password) {
      const salt = await bcrypt.genSalt(10);
      hashPassword = await bcrypt.hash(password, salt);
   }
   
   try {
      const userExist = await findOneUser(formatEmail(email))
      if(userExist){
         return res.status(400).json({ 
            message: "Já existe um usuário cadastrado nesse email" 
         })
      }
      await UserService.createUserService({
         name: name, 
         email: formatEmail(email),
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
  const { email, password, google_id, id_token, platform } = req.body;

  if (google_id) {
    if (!id_token || !email) {
      return res.status(400).json({
        message: "Dados não recebidos, por favor preencha todos os campos."
      });
    }
    if (!isValidJwt(id_token)) {
      return res.status(400).json({ 
         message: "ID Token inválido ou mal formado." 
      });
    }
  } else {
    if (!email || !password) {
      return res.status(400).json({
        message: "Dados não recebidos, por favor preencha todos os campos."
      });
    }
  }

  try {
    if (google_id) {
      let payload_google;
      try {
        payload_google = await verifyGoogleToken(id_token);
      } catch (err) {
         return res.status(401).json({ 
            message: "Falha na verificação do token Google." 
         });
      }

      if (!payload_google || payload_google.sub !== google_id) {
        return res.status(401).json({ 
         message: "Identificador Google inválido" 
      });
      }
    }

    const user = await findOneUser(formatEmail(email));
    if (!user) {
      return res.status(400).json({ 
         message: "Não foi encontrado um usuário com esse E-mail" 
      });
    }

    if (!google_id && user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ 
         message: "Credenciais inválidas, senha" 
      });
      }
    }

    if (google_id && user.google_id !== google_id) {
      return res.status(401).json({ 
         message: "Credenciais inválidas, google_id" 
      });
    }

    const access_token = jwt.sign(
      { id: user.id, email: user.email },
      jwt_secret,
      { expiresIn: "1d" }
    );
    const refresh_token = jwt.sign(
      { id: user.id, email: user.email },
      jwt_secret,
      { expiresIn: "7d" }
    );

    await redis.set(`refresh_token:${user.id}`, refresh_token, "EX", 7 * 24 * 60 * 60);

    if (platform === "mobile") {
      return res.status(200).json({
        message: "Login efetuado com sucesso!",
        access_token,
        refresh_token,
      });
    }

    if (platform === "web") {
      res.cookie("refresh_token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.status(200).json({
        message: "Login efetuado com sucesso!",
        access_token,
      });
    }
  } catch (err) {
    console.error("Ocorreu um erro no servidor, [ LOGIN USER ]", err);
    return res.status(500).json({ message: "Ocorreu um erro no servidor" });
  }
}


async function refreshTokenController(req, res) {

}

export default {
   createUserController,
   loginUserController
}