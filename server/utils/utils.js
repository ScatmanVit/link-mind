async function findOneUser(email) {
   await prisma.user.findUnique({
      where: {
         email: email
      }
   })
}

function captalize(word) {
   return word
      .charAt(0)
      .toUpperCase() + word
      .slice(1)
      .toLowerCase();
}

export default {
   findOneUser,
   captalize
}