"use client";
import React, { useState, useEffect } from "react";
import { Card, Row, Col, Input, Popover } from "antd";
import Web3 from "web3";
import axios from 'axios'
import nextConfig from '../next.config';

export default function NFTCardFrame() {
  const { Meta } = Card;
  const {Search} = Input;
  const reservoirApiKey = nextConfig?.env?.RESERVOIR_API_KEY;
  const [nfts, setNFTs] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [web3, setWeb3] = useState(null);
  const [searchTokenId, setSearchTokenId] = useState(''); // 搜索框的值

  useEffect(() => {
    console.log(reservoirApiKey)
    // 检查是否存在以太坊钱包提供程序
    if ((window as any).ethereum) {
      const web3Instance = new Web3((window as any).ethereum);


      // 请求用户授权连接钱包
      (window as any).ethereum.request({ method: 'eth_requestAccounts' })
        .then((accounts:any) => {
          // 用户已授权连接钱包
          // 可以在这里进行后续操作
          console.log(accounts)
          console.log("已连接钱包");
          // setWeb3(web3Instance)
          // setAccounts(accounts)
        })
        .catch((error:any) => {
          // 处理错误
          console.error(error);
        });
    } else {
      // 如果没有以太坊钱包提供程序，则显示错误或提示用户下载钱包应用程序
      console.error("未找到以太坊钱包提供程序");
    }

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
          })
          .catch(err => console.error(err));
      } catch (error) {
        console.log(error);
      }
    };

    fetchNFTs();
  }, []);

  // 根据 tokenId 进行过滤，如果搜索框为空则不进行过滤
  const filteredNFTs = searchTokenId
    ? nfts.filter((nft: { token: {tokenId: string }}) => nft.token.tokenId.toString() === searchTokenId)
    : nfts;

  // 搜索处理函数
  const handleSearch = (value:any) => {
    setSearchTokenId(value);
  };

  // 获取 metadata
  const getMetaData = async (tokenId:any) => {
    const res = await axios.post('http://localhost:3000/api/metadata?collection=0x5Af0D9827E0c53E4799BB226655A1de152A425a5&tokenId=' + tokenId)
    // console.log(res)
    return res.data.data.data
  }

  // 悬浮显示卡片内容
  const CardContent = ({nft}) => {

    const [metadata, setMetadata] = useState(null);

    useEffect(() => {
      // 异步加载 metadata
      const fetchMetadata = async () => {
        const response = await getMetaData(nft.token.tokenId) as { attributes: [{
          trait_type: string, value: string,
        }] };
        console.log(response)
        setMetadata(response); // 使用 setMetadata 更新 metadata 的值
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
                cover={<img alt={nft.name} src={nft.token.imageSmall} />}
              >
                <Meta title={nft.token.tokenId} />
              </Card>
            </Popover>
          </Col>
        ))}
      </Row>
    </div>
);
}



