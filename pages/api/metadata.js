import Web3 from 'web3';
import contractABI from '../../utils/contractABI.json';
import { getMetadata } from '../../utils/metadataParser';
import redis from '../../utils/redis'
import nextConfig from '../../next.config';


export default async function handler(req, res) {

  // 获取 web3 对象
  // todo：这里连接的 infura 提供的以太坊节点
  const web3 = new Web3(new Web3.providers.HttpProvider(nextConfig.env.PROVIDER_URL));

  const { collection, tokenId } = req.query;

  try {
    var metadata, metadataString

    // 访问前先判断是否存在于缓存中
    const redisKey = 'metadata:' + collection + ':' + tokenId
    const result = await redis.exists(redisKey)

    // 若缓存存在，则直接从缓存中获取
    if (result === 1) {
      metadataString = await redis.get(redisKey);
      metadata = JSON.parse(metadataString);
      console.log(metadata)
    } else {
      // 若不存在，则：
      // 通过调用合约的 tokenURI 方法获取元数据URI
      // todo: 此处的 contractABI 暂时为固定值，需要灵活变换（调用 Etherscan 接口？）
      const contract = new web3.eth.Contract(contractABI, collection);

      // todo: FetchError: request to https://mainnet.infura.io/v3/3d47a651521b492c8ae5570e790e967f failed, reason: connect ETIMEDOUT 128.121.146.235:443
      const uri = await contract.methods.tokenURI(tokenId).call();
      console.log(uri)

      // 解析元数据 URI 并获取元数据
      metadata = await getMetadata(uri);

      // 存储到缓存中
      redis.set(redisKey, JSON.stringify(metadata));
    }

    // 解析并返回元数据
    res.status(200).json({
      success: true,
      data: metadata
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: 'Failed to fetch metadata'
    });
  }
}


