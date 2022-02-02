export interface objectPlugin{
  [key: string]: any
}

export interface runPlugins{
  plugin: string,
  url?: string,
  options?: any
}