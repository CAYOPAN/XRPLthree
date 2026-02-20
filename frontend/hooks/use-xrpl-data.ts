"use client"

import useSWR from "swr"
import { fetchBalances, fetchEscrows } from "@/lib/api"

export function useBalances() {
  return useSWR("balances", fetchBalances, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
  })
}

export function useEscrows() {
  return useSWR("escrows", fetchEscrows, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
  })
}
