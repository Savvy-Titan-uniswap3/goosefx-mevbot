import { PublicKey } from '@solana/web3.js'
import React, { useEffect, useState } from 'react'
import { getFarmTokenPrices } from '../../../api/SSL'
import { useConnectionConfig } from '../../../context'
import { TOKEN_PROGRAM_ID } from '../../../web3'
import { revenueCol, TOKEN_PAIRS } from '../constants'
import { Table } from 'antd'

export interface IAccounts {
  [mint: string]: IAccount
}
export type IAccount = {
  amount: string
  decimals: number
  uiAmount: number
  uiAmountString: string
}

export const FinancialsStats = () => <SSLRevenue />

export const SSLRevenue = () => {
  const [revenueObj, setRevenueObj] = useState<any>()
  const [tokenPrices, setTokenprices] = useState<any>()
  const [dataSource, setDataSource] = useState<any>()
  //const [revenueUsingName, setRevenueUsingName] = useState<any>();
  const publicKey = new PublicKey('6nRsKbwm7Ezz4frjkdCNjBWyFjzZfW5jsWCaSVMARcsJ')
  const { connection } = useConnectionConfig()
  useEffect(() => {
    ;(async () => {
      const [parsedAccounts] = await Promise.all([
        connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID })
        //connection.getBalance(publicKey)
      ])
      const accounts = parsedAccounts.value.reduce((acc: IAccounts, { account }) => {
        const { mint, tokenAmount } = account.data.parsed.info
        acc[mint] = tokenAmount
        return acc
      }, {})
      const { data } = await getFarmTokenPrices({})
      setTokenprices(data)
      setRevenueObj(accounts)
    })()
  }, [])

  useEffect(() => {
    getpairInfo(revenueObj)
  }, [revenueObj])

  const getpairInfo = (revenueObj: any) => {
    const arr = []
    for (const mint in revenueObj) {
      const mintPrice = tokenPrices[TOKEN_PAIRS[mint].pair]['current']
      const mintRevenue = revenueObj[mint].uiAmount
      arr.push({
        token: TOKEN_PAIRS[mint].name,
        price: '$ ' + mintPrice,
        native: mintRevenue,
        dollar: '$ ' + mintRevenue * mintPrice
      })
    }
    setDataSource(arr)
  }

  return (
    <div>
      <h1>SSL Revenue</h1>
      <Table columns={revenueCol} dataSource={dataSource} />
    </div>
  )
}
