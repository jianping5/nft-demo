import Redis from 'ioredis'

// 创建 Redis 连接实例
const redis = new Redis({
  host: '175.178.127.100', // Redis 服务器的主机地址
  port: 6379,       // Redis 服务器的端口号
  password: 'wjp011205',
});

module.exports = redis;
