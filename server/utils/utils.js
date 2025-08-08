import { PrismaClient } from "@prisma/client";
import { OAuth2Client } from "google-auth-library";
import dotenv from 'dotenv'
dotenv.config()

const CLIENT_ID = process.env.CLIENT_GOOGLE_ID

const client = new OAuth2Client(CLIENT_ID)
const prisma = new PrismaClient()

export async function verifyGoogleToken(idToken){
   const ticket = await client.verifyIdToken({
      idToken,
      audience: CLIENT_ID
   })
   const payload = ticket.getPayload()
   return payload
} 

export function isValidJwt(token) {
  return typeof token === 'string' && token.split('.').length === 3;
}

export function formatEmail(email) {
   let emailFormated
   return emailFormated = email
      .replace(/\s+/g, '')
      .toLowerCase()
}

export async function findOneUser(email, idUser) {
   let user
   return (
      user = email !== "" ? await prisma.user.findUnique({
         where: {
            email: email
         }
      }) : ( idUser !== "" 
         && await prisma.user.findUnique({
            where: {
               id: idUser
            }
         }) 
      ) 
   ) 
}

export function captalize(word) {
   return word
      .charAt(0)
      .toUpperCase() + word
      .slice(1)
      .toLowerCase();
}
