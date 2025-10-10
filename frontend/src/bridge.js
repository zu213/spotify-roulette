
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


export async function postPlayer(playerName, topTracks) {
  return axios.post(`http://localhost:5000/create/${playerName}`, topTracks)
}

export async function postPlayerToTable(tableCode, playerName, topTracks) {
  return axios.post(`http://localhost:5000/table/${tableCode}/${playerName}`, topTracks)
}

export async function getTablePlayer(tableCode, player){
  return axios.get(`http://localhost:5000/table/${tableCode}/song/${player}`)
}

export async function getTable(tableCode) {
  return axios.get(`http://localhost:5000/table/${tableCode}`)
}