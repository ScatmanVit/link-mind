import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createUserService(data) {
   const { name, email, password, google_id } = data
   const userCreated = await prisma.user.create({
      data: {
         name: name,
         email: email,
         password: password,
         google_id: google_id
      }
   })
   return userCreated
}


export default {
   createUserService
}
