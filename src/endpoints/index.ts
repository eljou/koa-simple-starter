import fs from 'fs'
import path from 'path'
import { Middleware } from 'koa'
import logger from '../utils/logger'
import { CustomApp } from '../server'
import { hasIndexFile, isDirectory, getInnerDirectories, getFullPath } from '../utils/functions'

export interface Route {
  method: 'get'| 'post'| 'put'| 'delete',
  path: string,
  preMiddlewares?: Middleware[],
  controller: Middleware
}

const isValidRouteDirectory = (f: string) => {  
  return fs.lstatSync(f).isDirectory() && hasIndexFile(f)
}

const getRoutesTree = (currentPath: string, routes: string[] = []) => {
  if (isDirectory(currentPath)) {
    if (isValidRouteDirectory(currentPath)) {
      routes.push(currentPath)
    }

    getInnerDirectories(currentPath)
      .forEach(innerDir => {
        if (innerDir !== 'controller') {
          getRoutesTree(path.join(currentPath, innerDir), routes)
        }
      })
  }
}

export default {
  setRouter: (app: CustomApp) => {
    return new Promise(async (resolve, reject) => {
      logger.info('Registering routes:')
      
      const validRoutes: string[] = []
      fs.readdirSync(__dirname)
        .map(f => getFullPath(__dirname, f))
        .filter(isDirectory)
        .forEach(filePath => getRoutesTree(filePath, validRoutes))
      
      const defers: Promise<{ default:Route }>[] = []
      validRoutes.forEach(fullPath => defers.push(import(fullPath)))
  
      const routes = await Promise.all(defers)
      routes
        .map(r => r.default)
        .forEach(({ method, path: privatePath, controller, preMiddlewares = []}, index) => {
          const fullPath = validRoutes[index]
          const routePath = path.join(
            fullPath.substring(fullPath.indexOf(__dirname) + __dirname.length),
            privatePath
          ).replace(/\\/g, '/')
          
          // Register route on router
          app.context.router[method](routePath, ...preMiddlewares, controller)
          logger.verbose(`Registered route [${method.toUpperCase()}] ${routePath}`)
        })
  
      app.use(app.context.router.routes())
      app.emit('application:routes:loaded')
      resolve()
    })
  }
}