import { createContext, FC, ReactNode, useCallback, useContext, useState } from 'react'
import { INFTProfile, INFTUserActivity, INFTProfileConfig } from '../types/nft_profile.d'
import apiClient from '../api'
import { NFT_API_BASE, NFT_API_ENDPOINTS } from '../api/NFTs'

export type UserFetchType = 'address' | 'user_id' | 'nickname'

export const NFTProfileProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [sessionUser, setSessionUser] = useState<INFTProfile>()
  const [userActivity, setUserActivity] = useState<INFTUserActivity[]>([])

  const fetchSessionUser = useCallback(async (type: UserFetchType, parameter: string | number): Promise<any> => {
    try {
      const res = await apiClient(NFT_API_BASE).get(`${NFT_API_ENDPOINTS.SESSION_USER}?${type}=${parameter}`)
      if (res.data.length > 0) {
        setSessionUser(res.data[0])
      } else {
        setUnamedUser(type, parameter)
      }
      return res
    } catch (err) {
      return err
    }
  }, [])

  const fetchUserActivity = useCallback(async (id: number): Promise<any> => {
    try {
      const res = await apiClient(NFT_API_BASE).get(`${NFT_API_ENDPOINTS.USER_ACTIVITY}?user_id=${id}`)
      console.log(res)

      setUserActivity(res.data)
      return res
    } catch (err) {
      return err
    }
  }, [])

  const setUnamedUser = (type: UserFetchType, parameter: any) => {
    setSessionUser({
      user_id: type === 'user_id' ? parameter : null,
      pubkey: type === 'address' ? parameter : '',
      nickname: type === 'nickname' ? parameter : 'Unnamed',
      email: '',
      bio: '',
      twitter_link: '',
      instagram_link: '',
      facebook_link: '',
      youtube_link: '',
      profile_pic_link: '',
      is_verified: false
    })
  }

  return (
    <NFTProfileContext.Provider
      value={{
        sessionUser,
        setSessionUser,
        fetchSessionUser,
        userActivity,
        setUserActivity,
        fetchUserActivity
      }}
    >
      {children}
    </NFTProfileContext.Provider>
  )
}

const NFTProfileContext = createContext<INFTProfileConfig | null>(null)

export const useNFTProfile = (): INFTProfileConfig => {
  const context = useContext(NFTProfileContext)
  if (!context) {
    throw new Error('Missing NFT collection context')
  }

  return {
    sessionUser: context.sessionUser,
    setSessionUser: context.setSessionUser,
    fetchSessionUser: context.fetchSessionUser,
    userActivity: context.userActivity,
    setUserActivity: context.setUserActivity,
    fetchUserActivity: context.fetchUserActivity
  }
}
