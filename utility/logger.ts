import logger from 'pino';

const log = logger({
  prettyPrint: true,
  base: {
    pid: true
  },
  timestamp: ():string => new Date().toDateString()
})

export default log;
