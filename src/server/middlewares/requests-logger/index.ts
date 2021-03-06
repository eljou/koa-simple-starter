import logger from '@src/utils/logger'
import { Middleware } from 'koa'

const loggerMiddleware: Middleware = async (ctx, next): Promise<void> => {
  await next()
  const rt = ctx.response.get('X-Response-Time')
  logger.info(`${ctx.method} ${ctx.url} - ${rt}`)
}

export default loggerMiddleware
