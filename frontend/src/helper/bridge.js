
import axios from 'axios';

export const requestFromSpotify = async (token, endpoint, searchKey=null) => {
  if(!token) return

  const requestObject = {headers: {Authorization: `Bearer ${token}`}}

  if(searchKey){
    requestObject.params = {
      q: searchKey.searchKey,
      type: searchKey.type
    }
  }

  return await axios.get(`https://api.spotify.com/v1/${endpoint}`, requestObject)
}

export const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000'
export const SERVER_WS_URL = SERVER_URL.replace(/^http/, 'ws')

export async function getTable(tableCode) {
  return axios.get(`${SERVER_URL}/table/${tableCode}`)
}