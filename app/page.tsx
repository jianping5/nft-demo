"use client";
import React, { useState, useEffect } from "react";
import { Card, Row, Col, Input, Popover, Button } from "antd";
import Web3 from "web3";
import axios from 'axios'
import nextConfig from '../next.config';
import contractABI from '../utils/contractABI.json';

export default function NFTCardFrame() {
  const { Meta } = Card;
  const {Search} = Input;
  const reservoirApiKey = nextConfig?.env?.RESERVOIR_API_KEY;
  const [nfts, setNFTs] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [web3, setWeb3] = useState(null);
  const [filteredNFTs, setFilteredNFTs] = useState<{token: {tokenId: string, imageSmall: string}}[]>(nfts); // 初始值为 nfts 数组
  const [tokenIds, setTokenIds] = useState<string[]>([])
  const [searchTokenId, setSearchTokenId] = useState(''); // 搜索框的值

  // Fetch NFT data from Reservoir API
  const fetchNFTs = async () => {
    try {
      const options: RequestInit = {
        method: 'GET',
        headers: {
          accept: '*/*',
          'x-api-key': reservoirApiKey || '', // 确保 'apiKey' 的值不为 undefined
        },
      };

      fetch('https://api.reservoir.tools/tokens/v6?collection=0x5Af0D9827E0c53E4799BB226655A1de152A425a5', options)
        .then(response => response.json())
        .then(response => {
          console.log(response.tokens)
          setNFTs(response.tokens);
          setFilteredNFTs(response.tokens)
        })
        .catch(err => console.error(err));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    console.log(reservoirApiKey)
    // 检查是否存在以太坊钱包提供程序
    if ((window as any).ethereum) {
      const web3Instance = new Web3((window as any).ethereum);

      const tokenIds: string[] = [];

      // 请求用户授权连接钱包
      (window as any).ethereum.request({ method: 'eth_requestAccounts' })
        .then((accounts:any) => {
          // 用户已授权连接钱包
          // 可以在这里进行后续操作
          // console.log(accounts[0])
          const nftContract = new web3Instance.eth.Contract(contractABI, '0x5Af0D9827E0c53E4799BB226655A1de152A425a5');
          // todo： 这里暂时用别人的钱包地址（方便前端显示）
          const accountAddress = '0x9eAeC4D4296D3cd7C59847cDbf5c28C2C0ad0BC3'
          nftContract.methods.balanceOf(accountAddress).call()
          .then((balance:string) => {
            const numNFTs = parseInt(balance, 10);
            // console.log('NFT 数量:', numNFTs);
            for (let i = 0; i < numNFTs; i++) {
              nftContract.methods.tokenOfOwnerByIndex(accountAddress, i).call()
                .then((tokenId: string) => {
                  console.log('NFT ID:', tokenId);
                  tokenIds.push(tokenId);
                })
                .catch((error) => {
                  console.error('查询 NFT ID 出错:', error);
                });
            }
            console.log('所有的 tokenIds:', tokenIds); // 输出所有的 tokenId 数组
            setTokenIds(tokenIds)
          });
        })
        .catch((error:any) => {
          // 处理错误
          console.error(error);
        });
    } else {
      // 如果没有以太坊钱包提供程序，则显示错误或提示用户下载钱包应用程序
      console.error("未找到以太坊钱包提供程序");
    }
    // 获取 NFTS
    fetchNFTs();
  }, []);

  // 根据 tokenId 进行过滤，如果搜索框为空则不进行过滤
  useEffect(() => {
    filterNFTsBySearch();
  }, [searchTokenId]);

  const filterNFTsByClick = () => {
    var tmpNfts: {token: {tokenId: string, imageSmall: string}}[] = []
    var fetchPromises: Promise<Response>[] = []; // 存储所有fetch请求的Promise
  
    tokenIds.forEach(tokenId => {
      console.log("foreach", tokenId)
      const options: RequestInit = {
        method: 'GET',
        headers: {
          accept: '*/*',
          'x-api-key': reservoirApiKey || '',
        },
      };
  
      const fetchPromise = fetch('https://api.reservoir.tools/tokens/v6?collection=0x5Af0D9827E0c53E4799BB226655A1de152A425a5&tokenName=' + tokenId, options)
        .then(response => response.json())
        .then(response => {
          // todo: ... 会出现预料之外的结果
          // tmpNfts.push(...response.tokens);
          tmpNfts.push(response.tokens[0]);
          console.log("tmpNfs", tmpNfts)
          // console.log(tokenId, ...response.tokens); 
        })
        .catch(err => console.error(err));
  
      fetchPromises.push(fetchPromise); // 将每个fetch请求的Promise存入数组
    });
  
    Promise.all(fetchPromises)
      .then(() => {
        // 所有异步请求都完成后执行以下代码
        // todo: 为什么 tmpNfts 包含了 很多不属于当前钱包的 tokenId 的 token
        console.log("tmpNfts", tmpNfts);
        // const updatedFilteredNFTs = tmpNfts.filter((nft: { token: { tokenId: string, imageSmall: string }}) => {
        //   return tokenIds.includes(nft.token.tokenId);
        // });
        // console.log("12356789", updatedFilteredNFTs);
        setFilteredNFTs(tmpNfts);
      });
  };

  const filterNFTsBySearch = () => {
    const updatedFilteredNFTs = searchTokenId ? filteredNFTs.filter((nft: { token: {tokenId: string }}) => nft.token.tokenId.toString() === searchTokenId) : nfts;
    setFilteredNFTs(updatedFilteredNFTs);
  };

  // 搜索处理函数
  const handleSearch = (value:any) => {
    setSearchTokenId(value);
  };

  const handleButtonMe = () => {
    filterNFTsByClick();
  }

  const handleButtonAll = () => {
    fetchNFTs();
  }

  // 获取 metadata
  const getMetaData = async (tokenId:any) => {
    const res = await axios.post('https://nft-demo-eight.vercel.app/api/metadata?collection=0x5Af0D9827E0c53E4799BB226655A1de152A425a5&tokenId=' + tokenId)
    // console.log(res)
    return res.data.data.data
  }

  // 悬浮显示卡片内容
  const CardContent: React.FC<{ nft: {token: {tokenId: string, imageSmall: string}} }> = ({ nft }) => {

    const [metadata, setMetadata] = useState<null | { attributes: { trait_type: string; value: string; }[] }>(null);

    useEffect(() => {

      // 异步加载 metadata
      const fetchMetadata = async () => {
        const response = await getMetaData(nft.token.tokenId) as { attributes: [{
          trait_type: string, value: string,
        }] };
        // console.log(response)
        // 使用 setMetadata 更新 metadata 的值
        setMetadata(response); 
      };
  
      fetchMetadata();
    }, [nft.token.tokenId]);

    return (
      <Card>
        <Row gutter={16}>
          {/* 左边的列 */}
          <Col span={8}>
            <img src={nft.token.imageSmall} alt="图片" style={{ width: '100%', height: 'auto' }} />
          </Col>

          {/* 右边的列 */}
          <Col span={16}>
            <div>
              <p>Current Price: 0.2699 ETH</p>
              {metadata && (
                <>
                <div>
                  {/* 使用 Grid 组件创建多行小卡片 */}
                  <Row gutter={16}>
                    {metadata?.attributes.map((attribute, index) => (
                      // 循环遍历属性数组，并生成对应的小卡片
                      <Col span={6} key={index}>
                        <Card >
                          <p>{attribute.trait_type}</p>
                          <p>{attribute.value}</p>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              </>
            )}
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div>
      <Search placeholder="请输入 tokenId" onSearch={handleSearch} style={{ marginBottom: 16 }} />
      <div>
        <Button onClick={handleButtonMe}>查看我的 NFT</Button>
        <Button onClick={handleButtonAll}>查看全部 NFT</Button>
      </div>
      <Row gutter={[24, 24]}>
        {filteredNFTs.map((nft:any, index:any) => (
          <Col key={index} span={24/6}>
            <Popover 
            // 组件式引入，便于传递参数
            content={<CardContent nft={nft} />}
            overlayStyle={{ position: 'absolute', zIndex: 1000 }}
            >
              <Card
                hoverable
                cover={<img alt={nft.token.name} src={nft.token.imageSmall} />}
              >
                <Meta title={nft.token.tokenId} />
                <Meta title={nft.token.name} />
              </Card>
            </Popover>
          </Col>
        ))}
      </Row>
    </div>
);
}



