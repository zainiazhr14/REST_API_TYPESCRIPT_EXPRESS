import { objectPlugin, runPlugins } from './interfaces/plugin.interface';
import * as plugins from './plugins.json'

const NODE_MICRO_NAME: string = process.env.NODE_MICRO_NAME

const buildPluginsExpress = () : any => {
  let result: objectPlugin[] = [];
  const runPlugins: runPlugins[] = plugins['monorepo'];

  runPlugins.forEach(plugin => {
    let obj: objectPlugin = {};

    if (NODE_MICRO_NAME) {
      if (NODE_MICRO_NAME.includes(plugin.plugin)) {
        obj.routes = require(`./plugins/${plugin.plugin}`)
        obj.prefix = plugin.url ? plugin.url : `/${plugin.plugin}`

        if (plugin.options) obj.options = plugin.options
        result.push(obj)
      }
    } else {
      obj.routes = require(`./plugins/${plugin.plugin}`)
      obj.prefix = plugin.url ? plugin.url : `/${plugin.plugin}`

      if (plugin.options) obj.options = plugin.options
      result.push(obj)
    }
  })

  return result
}

module.exports = async (app: any, redis_client: any) => {
  const routes = buildPluginsExpress()
  for (const route of routes) {
    const routePrefix = await route.routes.register(redis_client)
    await app.use(route.prefix, routePrefix)
  }
  // for (const x of app._router.stack) {
  //   console.log(x.handle)
  // }
}