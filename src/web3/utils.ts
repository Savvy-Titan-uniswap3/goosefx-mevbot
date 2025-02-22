import { TOKEN_PROGRAM_ID } from 'openbook-ts/serum/lib/token-instructions'
import BN from 'bn.js'
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction } from '@solana/spl-token-v2'
import {
  Connection,
  PublicKey,
  Signer,
  Transaction,
  TransactionSignature,
  TransactionInstruction,
  SimulatedTransactionResponse,
  RpcResponseAndContext
} from '@solana/web3.js'
import { useLocalStorage } from '../utils'
import { NETWORK_CONSTANTS } from '../constants'
import { WalletContextState } from '@solana/wallet-adapter-react'

const SECONDS_30 = 30 * 1000
const COMMITMENT_LEVELS = ['processed', 'confirmed', 'finalized']

export const SOL_TLD_AUTHORITY = new PublicKey('58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx')

export const isValidSolanaAddress = (address: string): boolean => {
  try {
    return PublicKey.isOnCurve(address)
  } catch (error) {
    return false
  }
}

const getCommitmentIndex = (commitment: string): number => {
  const confirmationIndex = COMMITMENT_LEVELS.findIndex((element) => element === commitment)
  return confirmationIndex
}

const gfxConfirmTransaction = async (
  connection: Connection,
  sig: string,
  statusType: string,
  startTime: number
): Promise<any> => {
  const res = await connection.getSignatureStatuses([sig])
  const currentTime = new Date().getTime()
  if (currentTime - startTime >= SECONDS_30) {
    throw new Error('Transaction timeout error!')
  }
  const requiredCommitment = getCommitmentIndex(statusType)
  const onChainCommitment = getCommitmentIndex(res.value[0]?.confirmationStatus)
  if (res.value[0]?.err) throw new Error(res.value[0]?.err.toString())

  if (onChainCommitment > -1 && (onChainCommitment >= requiredCommitment || onChainCommitment === 2)) {
    const confirm = { value: { err: null } }
    return confirm
  } else {
    await new Promise((resolve) => setTimeout(() => resolve(true), 200))
    return gfxConfirmTransaction(connection, sig, statusType, startTime)
  }
}
export const confirmTransaction = async (
  connection: Connection,
  sig: string,
  statusType: string
): Promise<any> => {
  const startTime = new Date().getTime()
  return gfxConfirmTransaction(connection, sig, statusType, startTime)
}

export const createAssociatedTokenAccountIx = (
  mint: PublicKey,
  associatedAccount: PublicKey,
  owner: PublicKey
): TransactionInstruction => createAssociatedTokenAccountInstruction(owner, associatedAccount, owner, mint)

export const findAssociatedTokenAddress = async (
  walletAddress: PublicKey,
  tokenMintAddress: PublicKey
): Promise<PublicKey | null> =>
  (
    await PublicKey.findProgramAddress(
      [walletAddress.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), tokenMintAddress.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  )[0]

export const signAndSendRawTransaction = async (
  connection: Connection,
  transactionData: Transaction,
  wallet: WalletContextState,
  ...signers: Array<Signer>
): Promise<TransactionSignature | null> => {
  try {
    const transaction: Transaction = transactionData
    transaction.feePayer = wallet.publicKey
    transaction.recentBlockhash = (await connection.getLatestBlockhash('max')).blockhash

    signers.forEach((signer) => transaction.partialSign(signer))

    let simulateResult: SimulatedTransactionResponse | null = null
    try {
      simulateResult = (await connection.simulateTransaction(transaction)).value
      if (simulateResult.logs) {
        for (let i = simulateResult.logs.length - 1; i >= 0; --i) {
          const line = simulateResult.logs[i]
          if (line.startsWith('Program log: ')) {
            throw new Error('Transaction failed: ' + line.slice('Program log: '.length))
          }
        }
      }
    } catch (e) {
      console.error('Error: No simulation logs generated')
      console.dir(e)
    }

    const signedTransaction = await wallet.signTransaction(transaction)
    const tx = await connection.sendRawTransaction(signedTransaction?.serialize()) //, { skipPreflight: true }
    return tx
  } catch (e) {
    console.log(e)
    return null
  }
}

export const simulateTransaction = async (
  connection: Connection,
  transactionData: Transaction,
  wallet: WalletContextState,
  ...signers: Array<Signer>
): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> => {
  const transaction = transactionData
  transaction.feePayer = wallet.publicKey
  transaction.recentBlockhash = (await connection.getLatestBlockhash('max')).blockhash

  signers.forEach((signer) => transaction.partialSign(signer))

  const sim = await connection.simulateTransaction(transaction)

  return sim
}

// TODO: reconcile this function with other similar definition in the codebase
export const findProgramAddress = async (
  seeds: (Buffer | Uint8Array)[],
  programId: PublicKey
): Promise<[string, number]> => {
  // eslint-disable-next-line
  const localStorage = useLocalStorage()
  const key = `pda-${seeds.reduce((agg, item) => agg + item.toString('hex'), '')}${programId.toString()}`

  const cached = localStorage.getItem(key)
  if (cached) {
    const value = JSON.parse(cached)

    return [value.key, parseInt(value.nonce)] as [string, number]
  }

  const result = await PublicKey.findProgramAddress(seeds, programId)

  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        key: result[0].toBase58(),
        nonce: result[1]
      })
    )
  } catch {
    // ignore
  }

  return [result[0].toBase58(), result[1]] as [string, number]
}

export const int64to8 = (n: number): Uint8Array => {
  const arr = BigUint64Array.of(BigInt(n))
  return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength)
}

export const bnTo8 = (bn: BN): Uint8Array => Buffer.from([...bn.toArray('le', 8)])

export const getNetworkConnectionText = (network: string): string =>
  network === NETWORK_CONSTANTS.DEVNET ? NETWORK_CONSTANTS.DEVNET_SDK : NETWORK_CONSTANTS.MAINNET_SDK

export const openLinkInNewTab = (url: string): void => {
  const newTab = window.open(url, '_blank')
  if (newTab) {
    newTab.focus()
  }
}
export const getPriceObject = (str: string): string => {
  if (str === 'USDC') return `USDC/USDT`
  if (str === 'USDT') return 'USDT/USD'
  return `${str}/USDC`
}
