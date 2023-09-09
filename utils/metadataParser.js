import axios from "axios";

export const getMetadata = async function getMetadata(uri) {
    if (uri.startsWith('ipfs://')) {
        return handleIPFSMetadata(uri);
      } else if (uri.startsWith('data:')) {
        return handleBase64Metadata(uri);
      } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
        return handleExternalMetadata(uri);
      } else {
        throw new Error('不受支持的元数据URI');
      }
  }

  async function handleIPFSMetadata(uri) {
    const ipfsHash = uri.replace('ipfs://', '');
    const response = await axios.get(`https://ipfs.io/ipfs/${ipfsHash}`);
    return response.data;
  }
  
  async function handleBase64Metadata(uri) {
    const base64Data = uri.split(',')[1];
    const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');
    return JSON.parse(decodedData);
  }
  
  async function handleExternalMetadata(uri) {
    const response = await axios.get(uri);
    return response.data;
  }