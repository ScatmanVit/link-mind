import Redis from 'ioredis'
const redis = new Redis() 

redis.on('connect', () => {
  console.log('Redis conectado com sucesso!')
})

redis.on('error', (err) => {
  console.error('Erro no Redis:', err)
})

export default redis