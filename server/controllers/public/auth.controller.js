import UserService from "../../services/public/public.routes.js"
import redis from '../../config/redis.js'
import { captalize, findOneUser, formatEmail, verifyGoogleToken, isValidJwt } from "../../utils/utils.js"
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'

const jwt_secret = process.env.JWT_SECRET

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
      const userExist = await findOneUser(formatEmail(email), "")
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

    const user = await findOneUser(formatEmail(email), "");
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
   const { userId, platform } = req.body
   const token_mobile = req.headers.authorization
   const token_web = req.cookies.access_token;
   if(!["mobile", "web"].includes(platform)) {
      return res.status(400).json({ 
         message: "Plataforma inválida" 
      });
   }
   
   try {
      let decoded;
      let token;

      if (platform === "mobile") {
         if (!token_mobile) {
            return res.status(400).json({ message: "Token não fornecido para mobile." });
         }
         token = token_mobile.replace("Bearer ", "");
         decoded = jwt.verify(token, jwt_secret);
      }

      if (platform === "web") {
         if (!token_web) {
            return res.status(400).json({ message: "Token não fornecido para web." });
         }
         token = token_web; 
         decoded = jwt.verify(token, jwt_secret);
      }

      if (!decoded || !decoded.id) {
         return res.status(401).json({ 
            message: "Token inválido" 
         });
      }

      const user = await findOneUser("", userId)
      if(!user){
         return res.status(400).json({
            message: "Usuário não encontrado"
         })
      }

      if (decoded.id !== userId) {
         return res.status(403).json({
            message: "ID do token não corresponde ao id usuário fornecido"
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

      try {
         await redis.del(`refresh_token:${userId}`);
      } catch(err) {
         console.error("Erro no delete do token",err)
          return res.status(500).json({
            message: "Erro no servidor"
         })
      }
      try{
         await redis.set(`refresh_token:${userId}`, refresh_token, "EX", 7 * 24 * 60 * 60);
      } catch(err){
         console.error("Erro ao setar o novo token", err)
         return res.status(500).json({
            message: "Erro no servidor"
         })
      }

      if(platform === "mobile") {
        return res.status(200).json({
            message: "Sessão renovada com sucesso",
            access_token,
            refresh_token,
         });
      }

      if(platform === "web") {
         res.cookie("refresh_token", refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
         });
         return res.status(200).json({
            message: "Sessão renovada com sucesso",
            access_token,
         });
      }
   } catch(err) {
      console.error("Erro no refresh_token [ REFRESH TOKEN ]", err)
      return res.status(500).json({
         message: "Erro no servidor"
      })
   }  
}

export default {
   createUserController,
   loginUserController,
   refreshTokenController
}