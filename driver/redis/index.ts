import { createClient } from 'redis';
import log from '../../utility/logger'

const REDIS_URL = process.env.REDIS_URL;

const init = async () => {
  const client = createClient({
    url: REDIS_URL
  });

  client.on('connect', function() {
    log.info('Redis Connected!');
  });

  await client.connect();


  return client
}

export default init;