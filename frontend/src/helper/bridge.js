
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

function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return values.reduce((acc, x) => acc + possible[x % possible.length], '')
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function getSpotifyAuthUrl(clientId, redirectUri) {
  const verifier = generateRandomString(64)
  window.localStorage.setItem('code_verifier', verifier)
  const challenge = await generateCodeChallenge(verifier)

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'user-top-read',
    code_challenge_method: 'S256',
    code_challenge: challenge
  })

  return `https://accounts.spotify.com/authorize?${params}`
}

export async function exchangeCodeForToken(clientId, redirectUri, code) {
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    code_verifier: window.localStorage.getItem('code_verifier')
  })

  const response = await axios.post('https://accounts.spotify.com/api/token', body)
  window.localStorage.removeItem('code_verifier')
  return response.data
}

export const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000'
export const SERVER_WS_URL = SERVER_URL.replace(/^http/, 'ws')

export async function getTable(tableCode) {
  return axios.get(`${SERVER_URL}/table/${tableCode}`)
}