import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

export async function findOneUser(email) {
   let user
   return user = await prisma.user.findUnique({
      where: {
         email: email
      }
   })
}

export function captalize(word) {
   return word
      .charAt(0)
      .toUpperCase() + word
      .slice(1)
      .toLowerCase();
}
