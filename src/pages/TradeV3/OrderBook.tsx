/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { FC, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Dropdown, Skeleton } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import { MarketSide, useCrypto, useDarkMode, useOrder, useOrderBook } from '../../context'
import { checkMobile, removeFloatingPointError } from '../../utils'
import tw, { styled } from 'twin.macro'
import { Button, cn, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'gfx-component-lib'
import { ContentLabel, InfoLabel } from './perps/components/PerpsGenericComp'

const SPREADS = [1 / 100, 5 / 100, 1 / 10, 5 / 10, 1]

const HEADER = styled.div`
  ${tw`h-[31px] w-full p-0 text-xs h-7`}
  border-bottom: 1px solid ${({ theme }) => theme.tokenBorder};
  & div {
    ${tw`flex justify-between items-center h-full px-2 dark:text-grey-2 text-grey-1`}
    h5 {
      ${tw`inline-block w-1/3 text-tiny`}
    }
    h5:nth-child(2) {
      ${tw`text-center`}
    }
    h5:nth-child(3) {
      ${tw`text-right`}
    }
    h5:nth-child(3) {
      ${tw`text-right w-1/3 justify-end`}
    }
  }
  div:nth-child(2) {
    ${tw`mt-3.75`}
    span {
      ${tw`text-smallest`}
    }
    span:nth-child(3) {
      ${tw`text-right`}
    }
  }
  .buy {
    color: #50bb35;
    font-weight: 700 bold;
  }
  .sell {
    ${tw`font-bold`}
    color: #f06565;
  }
`

const LOADER = styled(Skeleton.Input)`
  width: 100%;
  max-height: 328px;
  height: 20px;
  .ant-skeleton-input {
    width: 100%;
  }
  span {
    height: 10px !important;

    &:first-child {
      margin-top: ${({ theme }) => theme.margin(0.5)};
    }
  }
`

const ORDERS = styled.div<{ $visible: boolean }>`
  ${({ theme }) => theme.flexColumnNoWrap}
  height: calc(100% - 70px);
  ${tw`max-sm:max-h-[222px]`}
  justify-content: space-between;
  align-items: center;
  max-height: ${({ $visible }) => ($visible ? '328px' : 'auto')};
  padding-right: 2px;
  overflow-y: scroll;
  ${({ theme }) => theme.customScrollBar('4px')};
  &::-webkit-scrollbar {
    display: none;
  }
  /* Hide scrollbar for IE, Edge and Firefox */
  & {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
  transition: max-height ${({ theme }) => theme.mainTransitionTime} ease-in-out;
`

const ORDER_BUY = styled.div`
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin: ${({ theme }) => theme.margin(1)} 0;
  height: 20px;
  span {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    border-radius: 2px 0 0 2px;
    color: ${({ theme }) => theme.text21};

    &:not(:last-child) {
      z-index: 2;
    }

    &:first-child {
      text-align: left;
      cursor: pointer;

      &:hover {
        font-weight: bold;
      }
    }

    &:nth-child(2) {
      cursor: pointer;
      text-align: right;
      padding-right: 10px;
      color: ${({ theme }) => theme.bidColor};
      &:hover {
        font-weight: bold;
      }
    }

    &:nth-child(3) {
      text-align: right;
      cursor: auto;
    }
  }
`
const ORDER_SELL = styled.div`
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 20px;
  margin: ${({ theme }) => theme.margin(1)} 0;

  span {
    flex: 1;
    font-size: 13px;
    font-weight: 500;

    color: ${({ theme }) => theme.text21};

    &:not(:last-child) {
      z-index: 2;
    }

    &:first-child {
      text-align: left;
      cursor: pointer;
      padding-left: 10px;
      color: ${({ theme }) => theme.askColor};
      &:hover {
        font-weight: bold;
      }
    }

    &:nth-child(2) {
      cursor: pointer;
      text-align: right;

      &:hover {
        font-weight: bold;
      }
    }

    &:nth-child(3) {
      text-align: right;
      cursor: auto;
    }
  }
`

const SIZE_BUY = styled.span`
  ${tw`bg-green-4`}
  position: absolute;
  right: 0;
  height: 100%;
`
const SIZE_SELL = styled.span`
  ${tw`bg-red-2`}
  position: absolute;
  left: 0;
  height: 100%;
`
const WRAPPER = styled.div`
  position: relative;
  width: 100%;
  padding: 0px 0px 0px 0px;
  overflow: hidden;
`

const ORDERBOOK_CONTAINER = styled.div`
  ${tw`max-sm:overflow-auto max-sm:max-h-[150px]`}
  width: 100%;
  display: flex;
  overflow-y: auto;
  align-items: baseline;
  justify-content: center;
  padding: 0px 0px;
  /* height: 100%; */
  span {
    width: 50%;
  }
`

const SPREAD_FOOTER = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  position: absolute;
  padding-left: 5px;
  padding-right: 5px;
  bottom: 0px;
  //background-color: ${({ theme }) => theme.bg13};
  div {
    color: ${({ theme }) => theme.text1};

    span {
      background-color: ${({ theme }) => theme.bg15};
      padding: 5px;
      border-radius: 5px;
      margin-left: 10px;
    }
  }
  ${tw`h-8 border-t-[1px] border-solid dark:border-[#3c3c3c] border-[#CACACA] w-full`}
  border-bottom: none;
  border-left: none;
  border-right: none;

  .spreadDropdown {
    > span {
      background: none;
      cursor: pointer;
    }
  }
`

const Loader: FC = () => (
  <>
    {[...Array(10).keys()].map((_, index) => (
      <LOADER key={index} active size="small" />
    ))}
  </>
)

function usePrevious(value) {
  const ref = useRef()
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

export const OrderBook: FC = () => {
  const { getAskSymbolFromPair, getBidSymbolFromPair, selectedCrypto } = useCrypto()
  const { mode } = useDarkMode()
  const { order, setFocused, setOrder } = useOrder()
  const { orderBook } = useOrderBook()
  const [bids] = useState<MarketSide>('bids')
  const [asks] = useState<MarketSide>('asks')
  const bid = useMemo(() => getBidSymbolFromPair(selectedCrypto.pair), [getBidSymbolFromPair, selectedCrypto.pair])
  const ask = useMemo(() => getAskSymbolFromPair(selectedCrypto.pair), [getAskSymbolFromPair, selectedCrypto.pair])
  const [spreadIndex, setSpreadIndex] = useState<number>(0)
  const prevOrderBook: any = usePrevious(orderBook)
  const [showSpread, setShowSpread] = useState<boolean>(false)
  const [neworders, setNewOrders] = useState<{ bids: number[]; asks: number[] }>({
    bids: [],
    asks: []
  })

  const [bidOrderBookDisplay, setBidOrderBookDisplay] = useState([])
  const [askOrderBookDisplay, setAskOrderBookDisplay] = useState([])

  const isModulo = (num1, num2) => {
    const result = (num1 + 0.00001) % num2
    if (result < 0.0001) return true
    return false
  }

  const editOrderBookBid = () => {
    function getBucketValue(bidAmount, spread) {
      const value = +(bidAmount / spread).toFixed(2)
      if (isModulo(bidAmount, spread)) return { decimal: false, value: bidAmount }
      else return { decimal: true, value: Math.floor(value) * spread }
    }
    const completeOrderBookBids = orderBook[bids],
      selectedSpread = SPREADS[spreadIndex],
      buckets = [],
      firstBucket = getBucketValue(completeOrderBookBids[0][0], selectedSpread).value
    let lastBucket = firstBucket,
      currentBucketSum = 0
    for (let i = 0; i < 100 && i < completeOrderBookBids.length; i++) {
      if (completeOrderBookBids[i][0] >= lastBucket) {
        currentBucketSum += completeOrderBookBids[i][1]
      } else {
        buckets.push([lastBucket, currentBucketSum])
        currentBucketSum = 0
        lastBucket = getBucketValue(completeOrderBookBids[i][0], selectedSpread).value
        currentBucketSum += completeOrderBookBids[i][1]
      }
      if (i === completeOrderBookBids.length - 1) buckets.push([lastBucket, currentBucketSum])
    }
    setBidOrderBookDisplay(buckets)
  }
  const editOrderBookAsk = () => {
    function getBucketValue(askAmount, spread) {
      const value = +(askAmount / spread).toFixed(2)
      if (isModulo(askAmount, spread)) return { decimal: false, value: askAmount }
      else return { decimal: true, value: (Math.floor(value) + 1) * spread }
    }
    const completeOrderBookBids = orderBook[asks],
      selectedSpread = SPREADS[spreadIndex],
      buckets = [],
      firstBucket = getBucketValue(completeOrderBookBids[0][0], selectedSpread).value

    let lastBucket = firstBucket,
      currentBucketSum = 0
    for (let i = 0; i < 100 && i < completeOrderBookBids.length; i++) {
      if (completeOrderBookBids[i][0] <= lastBucket) {
        currentBucketSum += completeOrderBookBids[i][1]
      } else {
        buckets.push([lastBucket, currentBucketSum])
        currentBucketSum = 0
        lastBucket = getBucketValue(completeOrderBookBids[i][0], selectedSpread).value
        currentBucketSum += completeOrderBookBids[i][1]
      }
      if (i === completeOrderBookBids.length - 1) buckets.push([lastBucket, currentBucketSum])
    }
    setAskOrderBookDisplay(buckets)
  }

  useEffect(() => {
    if (orderBook[bids].length > 0) {
      editOrderBookBid()
    } else setBidOrderBookDisplay([])
    if (orderBook[asks].length > 0) {
      editOrderBookAsk()
    } else setAskOrderBookDisplay([])
  }, [orderBook, spreadIndex, selectedCrypto.pair])

  useEffect(() => {
    if (prevOrderBook) {
      const newBids = [],
        newAsks = []
      if (prevOrderBook.bids.length) {
        for (let i = 0; i < orderBook.bids.length; i++) {
          if (prevOrderBook.bids.length < i + 1) {
            newBids.push(i)
          } else if (
            prevOrderBook.bids[i][0] !== orderBook.bids[i][0] ||
            prevOrderBook.bids[i][1] !== orderBook.bids[i][1]
          ) {
            newBids.push(i)
          }
        }
      }
      if (prevOrderBook.asks.length) {
        for (let i = 0; i < orderBook.asks.length; i++) {
          if (prevOrderBook.asks.length < i + 1) {
            newAsks.push(i)
          } else if (
            prevOrderBook.asks[i][0] !== orderBook.asks[i][0] ||
            prevOrderBook.asks[i][1] !== orderBook.asks[i][1]
          ) {
            newAsks.push(i)
          }
        }
      }
      setNewOrders({ bids: newBids, asks: newAsks })
    }
  }, [orderBook])

  function timeout(delay: number) {
    return new Promise((res) => setTimeout(res, delay))
  }

  const setDefaultIndex = async () => {
    if (neworders.bids.length || neworders.asks.length) {
      await timeout(1000)
      setNewOrders({ bids: [], asks: [] })
    }
  }

  useEffect(() => {
    setDefaultIndex()
  }, [neworders])

  const slicedOrderBookBids = useMemo(
    () => (bidOrderBookDisplay.length > 14 ? bidOrderBookDisplay.slice(0, 14) : bidOrderBookDisplay),
    [bidOrderBookDisplay]
  )

  const totalOrderBookValueBids = useMemo(
    () => slicedOrderBookBids.reduce((acc, [size, price]) => acc + size * price, 0),
    [slicedOrderBookBids]
  )

  const slicedOrderBookAsks = useMemo(
    () => (askOrderBookDisplay.length > 14 ? askOrderBookDisplay.slice(0, 14) : askOrderBookDisplay),
    [askOrderBookDisplay]
  )
  const totalOrderBookValueAsks = useMemo(
    () => slicedOrderBookAsks.reduce((acc, [size, price]) => acc + size * price, 0),
    [slicedOrderBookAsks]
  )

  const spreadAbsolute = useMemo(() => {
    if (!slicedOrderBookAsks.length || !slicedOrderBookBids.length) return [0, 0]
    const midValue = +((slicedOrderBookAsks[0][0] + slicedOrderBookBids[0][0]) / 2).toFixed(2),
      absolute = +(slicedOrderBookAsks[0][0] - slicedOrderBookBids[0][0]).toFixed(2)
    return [absolute, ((absolute / midValue) * 100).toFixed(2)]
  }, [slicedOrderBookBids, slicedOrderBookAsks])

  //const handleExpandToggle = () => setOrder((prevState) => ({ ...prevState, isHidden: !prevState.isHidden }))

  const handleSetPrice = (price: number) => {
    setOrder((prevState) => ({ ...prevState, price }))
    setFocused('price')
  }

  const handleSetSize = (size: number) => {
    setOrder((prevState) => ({ ...prevState, size }))
    setFocused('size')
  }

  const SPREAD_DROPDOWN = (
    <>
      {SPREADS.map((item, index) => (
        <DropdownMenuItem key={index} className="w-full" onClick={() => setSpreadIndex(index)}>
          {item}
        </DropdownMenuItem>
      ))}
    </>
  )

  return (
    <div className={cn('h-full max-sm:max-h-[220px]')}>
      {
        <div className={cn('flex pl-2 h-[38px] items-center justify-between pb-1')}>
          <div>
            <InfoLabel>
              {'Spread:'} {spreadAbsolute[1]}%
            </InfoLabel>
          </div>
          <div>
            {/* {
              <Dropdown overlay={SPREAD_DROPDOWN} trigger={['click']} overlayClassName={`spread-dropdown ${mode}`}>
                <div className="spreadDropdown">
                  {SPREADS[spreadIndex]}
                  <DownOutlined />
                </div>
              </Dropdown>
            } */}
            <DropdownMenu open={showSpread} onOpenChange={setShowSpread}>
              <DropdownMenuTrigger asChild={true}>
                <Button
                  variant="outline"
                  colorScheme="secondaryGradient"
                  onClick={() => setShowSpread(true)}
                  className={cn('max-content mr-2 h-[30px] w-[88px]')}
                >
                  <div className="flex w-full justify-between items-center text-tiny">
                    ${SPREADS[spreadIndex]}
                    <img
                      style={{
                        transform: `rotate(${showSpread ? '0deg' : '180deg'})`,
                        transition: 'transform 0.2s ease-in-out'
                      }}
                      src={`/img/mainnav/connect-chevron-${mode}.svg`}
                      alt={'connect-chevron'}
                    />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent asChild>
                <div className={'flex flex-col gap-1.5 items-start  max-w-[250px]'}>{SPREAD_DROPDOWN}</div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      }
      <div className={cn('px-2.5')}>
        <div
          className="flex border h-8 border-t-0 border-l-0 pb-1 border-r-0
        items-center justify-between overflow-auto dark:border-b-black-4 dark:border-r-0
         border-b-grey-4"
        >
          <InfoLabel>Size ({ask})</InfoLabel>
          <InfoLabel> Price ({bid})</InfoLabel>
          <InfoLabel>Size ({ask})</InfoLabel>
        </div>
      </div>

      <ORDERS $visible={order.isHidden || (!orderBook.bids.length && !orderBook.asks.length)}>
        {!orderBook.bids.length && !orderBook.asks.length ? (
          <Loader />
        ) : (
          <ORDERBOOK_CONTAINER>
            <div
              className="!border-t-0 dark:border-r-black-4 border-r-grey-4 
            !border-b-0 !border-l-0 pl-2 w-[50%] h-[40%] border"
            >
              {
                slicedOrderBookBids.reduce(
                  (acc: { nodes: ReactNode[]; totalValue: number }, [price, size], index) => {
                    const value = price * size
                    acc.totalValue += value
                    acc.nodes.push(
                      <ORDER_BUY key={index}>
                        <span onClick={() => handleSetSize(size)}>
                          <ContentLabel>
                            <p className="text-[13px] pl-0.5">{removeFloatingPointError(size)}</p>
                          </ContentLabel>
                        </span>
                        <span onClick={() => handleSetPrice(price)}>
                          <InfoLabel>
                            <p className="text-[13px]">${removeFloatingPointError(price)}</p>
                          </InfoLabel>
                        </span>

                        <SIZE_BUY
                          style={{
                            width: `${(acc.totalValue / totalOrderBookValueBids) * 100}%`,
                            opacity: neworders.bids.includes(index) ? '1' : '0.4'
                          }}
                        />
                      </ORDER_BUY>
                    )
                    return acc
                  },
                  { nodes: [], totalValue: 0 }
                ).nodes
              }
            </div>
            <span
              className="border-t-0 border-r-0 
            dark:border-b-0 border-l-0  pr-2 h-full"
            >
              {
                slicedOrderBookAsks.reduce(
                  (acc: { nodes: ReactNode[]; totalValue: number }, [price, size], index) => {
                    const value = price * size
                    acc.totalValue += value
                    acc.nodes.push(
                      <ORDER_SELL key={index}>
                        <span onClick={() => handleSetPrice(price)}>
                          <InfoLabel>
                            <p className="text-[13px]">${removeFloatingPointError(price)}</p>
                          </InfoLabel>
                        </span>
                        <span onClick={() => handleSetSize(size)}>
                          <ContentLabel>
                            <p className="text-[13px] pr-0.5">{removeFloatingPointError(size)}</p>
                          </ContentLabel>
                        </span>

                        <div
                          className={cn('bg-red-2 rounded-r-[2px] absolute left-0 h-full')}
                          style={{
                            width: `${(acc.totalValue / totalOrderBookValueAsks) * 100}%`,
                            opacity: neworders.asks.includes(index) ? '1' : '0.4'
                          }}
                        />
                      </ORDER_SELL>
                    )
                    return acc
                  },
                  { nodes: [], totalValue: 0 }
                ).nodes
              }
            </span>
          </ORDERBOOK_CONTAINER>
        )}
      </ORDERS>
    </div>
  )
  return (
    <WRAPPER>
      <HEADER>
        <div>
          <h5>Size ({ask})</h5>
          <h5> Price ({bid})</h5>
          <h5>Size ({ask})</h5>
        </div>
      </HEADER>
      <ORDERS $visible={order.isHidden || (!orderBook.bids.length && !orderBook.asks.length)}>
        {!orderBook.bids.length && !orderBook.asks.length ? (
          <Loader />
        ) : (
          <ORDERBOOK_CONTAINER>
            <span>
              {
                slicedOrderBookBids.reduce(
                  (acc: { nodes: ReactNode[]; totalValue: number }, [price, size], index) => {
                    const value = price * size
                    acc.totalValue += value
                    acc.nodes.push(
                      <ORDER_BUY key={index}>
                        <span onClick={() => handleSetSize(size)}>{removeFloatingPointError(size)}</span>
                        <span onClick={() => handleSetPrice(price)}>${removeFloatingPointError(price)}</span>

                        <SIZE_BUY
                          style={{
                            width: `${(acc.totalValue / totalOrderBookValueBids) * 100}%`,
                            opacity: neworders.bids.includes(index) ? '1' : '0.3'
                          }}
                        />
                      </ORDER_BUY>
                    )
                    return acc
                  },
                  { nodes: [], totalValue: 0 }
                ).nodes
              }
            </span>
            <span>
              {
                slicedOrderBookAsks.reduce(
                  (acc: { nodes: ReactNode[]; totalValue: number }, [price, size], index) => {
                    const value = price * size
                    acc.totalValue += value
                    acc.nodes.push(
                      <ORDER_SELL key={index}>
                        <span onClick={() => handleSetPrice(price)}>${removeFloatingPointError(price)}</span>
                        <span onClick={() => handleSetSize(size)}>{removeFloatingPointError(size)}</span>
                        <SIZE_SELL
                          style={{
                            width: `${(acc.totalValue / totalOrderBookValueAsks) * 100}%`,
                            opacity: neworders.asks.includes(index) ? '1' : '0.3'
                          }}
                        />
                      </ORDER_SELL>
                    )
                    return acc
                  },
                  { nodes: [], totalValue: 0 }
                ).nodes
              }
            </span>
          </ORDERBOOK_CONTAINER>
        )}
      </ORDERS>
      {!checkMobile() && (
        <SPREAD_FOOTER>
          <div>{'Spread'}</div>
          <div>{spreadAbsolute[1]}%</div>
          <div>
            {
              <Dropdown overlay={SPREAD_DROPDOWN} trigger={['click']} overlayClassName={`spread-dropdown ${mode}`}>
                <div className="spreadDropdown">
                  {SPREADS[spreadIndex]}
                  <DownOutlined />
                </div>
              </Dropdown>
            }
          </div>
        </SPREAD_FOOTER>
      )}
    </WRAPPER>
  )
}
