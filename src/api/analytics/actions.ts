import axios from 'axios'
import { httpClient } from '../'
import { ANALYTICS_ENDPOINTS, ANALYTICS_SUBDOMAIN } from './constants'
import { SOLSCAN_BASE } from '../../constants'

export const getGofxHolders = async (): Promise<any> => {
  try {
    const res = await axios(
      `${SOLSCAN_BASE}/token${ANALYTICS_ENDPOINTS.META_DATA}${ANALYTICS_ENDPOINTS.GOFX_TOKEN}`
    )
    return res.data
  } catch (err) {
    return err
  }
}

export const getTotalLiquidityVolume = async (): Promise<any> => {
  try {
    const { data } = await httpClient(ANALYTICS_SUBDOMAIN).get(ANALYTICS_ENDPOINTS.GET_LIQUIDITY)
    return data
  } catch (err) {
    return err
  }
}
export const getCronUpTimeData = async (): Promise<any> => {
  try {
    const { data } = await httpClient(ANALYTICS_SUBDOMAIN).get(ANALYTICS_ENDPOINTS.GET_CRON_UPTIME)
    return data
  } catch (err) {
    return err
  }
}

export const getWorkingRPCEndpoints = async (): Promise<any> => {
  try {
    const { data } = await httpClient(ANALYTICS_SUBDOMAIN).get(ANALYTICS_ENDPOINTS.GET_WORKING_RPC_ENDPOINT)
    return data
  } catch (err) {
    return err
  }
}

export const getTokenDetails = async (): Promise<any> => {
  try {
    const { data } = await axios.get(
      `https://pro-api.solscan.io/v1.0/wallet/info/${ANALYTICS_ENDPOINTS.GFX_WALLET}`
    )
    return data
  } catch (err) {
    return err
  }
}

export const getSOLPrice = async (): Promise<any> => {
  try {
    const { data } = await axios.get(`https://api.solscan.io/market?symbol=SOL&cluster=`)
    return data.data.priceUsdt
  } catch (err) {
    return err
  }
}

export const fetchBrowserCountryCode = async (): Promise<null | string> => {
  try {
    const resp = await axios.get(`https://geocode.goosefx.workers.dev`)
    const country = resp.data.country
    return country.toUpperCase()
  } catch (error) {
    console.error(error)
    return null
  }
}
