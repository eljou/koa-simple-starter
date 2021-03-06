import fs from 'fs'
import path from 'path'
import Router from 'koa-router'
import { AppExtension } from '..'
import { CustomApp } from '../../server'
import logger from '../../utils/logger'

function parseMsToHumanTime(ms: number, delim = ': '): string {
  const showWith0 = (value: number): string => (value < 10 ? `0${value}` : `${value}`)
  const hours = showWith0(Math.floor((ms / (1000 * 60 * 60)) % 60))
  const minutes = showWith0(Math.floor((ms / (1000 * 60)) % 60))
  const seconds = showWith0(Math.floor((ms / 1000) % 60))
  return `${parseInt(hours) ? `${hours} hrs${delim}` : ''}${minutes} min${delim}${seconds} sec`
}

const healthyCheckController = {
  getSoftwareData: (startTime: number): object => {
    const projectConf = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), { encoding: 'utf8' }))
    return {
      name: projectConf.name,
      version: projectConf.version,
      author: projectConf.author,
      upTime: parseMsToHumanTime(Date.now() - startTime),
    }
  },
}

const healthyCheckExtension: AppExtension = {
  load: (app: CustomApp): void => {
    const router: Router = app.context.router
    if (router) {
      logger.verbose(`registered route [GET] /health`)
      router.get(
        '/health',
        (ctx): void => {
          ctx.status = 200
          ctx.body = { ...healthyCheckController.getSoftwareData(ctx.startTime) }
        },
      )
    }
  },
}

export default healthyCheckExtension
