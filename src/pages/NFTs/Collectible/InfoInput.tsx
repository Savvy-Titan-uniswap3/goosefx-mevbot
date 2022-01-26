import React, { useState, FC } from 'react'
import styled from 'styled-components'
import { MainText } from '../../../styles'

const INPUT_TITLE = MainText(styled.span`
  font-size: 17px;
  font-weight: 600;
  color: ${({ theme }) => theme.text8} !important;
  text-align: left;
  margin-top: ${({ theme }) => theme.margins['1.5x']};
  margin-bottom: ${({ theme }) => theme.margins['1x']};
`)

const INPUT_LIMIT = MainText(styled.span`
  font-size: 9px;
  font-weight: 600;
  color: ${({ theme }) => theme.text8} !important;
  text-align: left;
  margin-top: ${({ theme }) => theme.margins['1x']};
`)

const INPUT_CONTAINER = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`

const STYLED_INPUT = styled.input`
  height: 55px;
  width: 100%;
  border-radius: 10px;
  background-color: ${({ theme }) => theme.inputBg};
  padding: ${({ theme }) => `${theme.margins['1x']}`};
  border: none;
  ::placeholder {
    color: #636363;
    font-size: 12px;
  }
  &:focus {
    outline-width: 0;
  }
`

const InfoInput: FC<{
  title: string
  placeholder: string
  value: string
  maxLength: number
  onChange: (val: any) => void
}> = ({ title, maxLength, placeholder, onChange, value }) => {
  return (
    <INPUT_CONTAINER>
      <INPUT_TITLE>{title}</INPUT_TITLE>
      <STYLED_INPUT value={value} placeholder={placeholder} onChange={onChange} maxLength={maxLength} />
      <INPUT_LIMIT>
        {value.length} of {maxLength} characters limit
      </INPUT_LIMIT>
    </INPUT_CONTAINER>
  )
}

export default React.memo(InfoInput)
