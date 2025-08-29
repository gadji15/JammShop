"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface PaymentData {
  orderId: string
  amount: number
  method: "cash_on_delivery" | "orange_money" | "wave" | "free_money"
  phoneNumber?: string
  customerName: string
  customerEmail: string
}

interface PaymentResult {
  success: boolean
  transactionId?: string
  message: string
  redirectUrl?: string
}

export function usePayments() {
  const [processing, setProcessing] = useState(false)
  const supabase = createClient()

  // Simulate Orange Money payment
  const processOrangeMoneyPayment = async (data: PaymentData): Promise<PaymentResult> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Simulate success/failure (90% success rate)
    const isSuccess = Math.random() > 0.1

    if (isSuccess) {
      return {
        success: true,
        transactionId: `OM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: "Paiement Orange Money réussi",
      }
    } else {
      return {
        success: false,
        message: "Échec du paiement Orange Money. Vérifiez votre solde et réessayez.",
      }
    }
  }

  // Simulate Wave payment
  const processWavePayment = async (data: PaymentData): Promise<PaymentResult> => {
    await new Promise((resolve) => setTimeout(resolve, 2500))

    const isSuccess = Math.random() > 0.1

    if (isSuccess) {
      return {
        success: true,
        transactionId: `WAVE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: "Paiement Wave réussi",
      }
    } else {
      return {
        success: false,
        message: "Échec du paiement Wave. Vérifiez vos informations et réessayez.",
      }
    }
  }

  // Simulate Free Money payment
  const processFreeMoneyPayment = async (data: PaymentData): Promise<PaymentResult> => {
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const isSuccess = Math.random() > 0.1

    if (isSuccess) {
      return {
        success: true,
        transactionId: `FREE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: "Paiement Free Money réussi",
      }
    } else {
      return {
        success: false,
        message: "Échec du paiement Free Money. Vérifiez votre solde et réessayez.",
      }
    }
  }

  // Process payment based on method
  const processPayment = async (data: PaymentData): Promise<PaymentResult> => {
    setProcessing(true)

    try {
      let result: PaymentResult

      switch (data.method) {
        case "orange_money":
          result = await processOrangeMoneyPayment(data)
          break
        case "wave":
          result = await processWavePayment(data)
          break
        case "free_money":
          result = await processFreeMoneyPayment(data)
          break
        case "cash_on_delivery":
          result = {
            success: true,
            transactionId: `COD_${Date.now()}`,
            message: "Commande confirmée - Paiement à la livraison",
          }
          break
        default:
          throw new Error("Méthode de paiement non supportée")
      }

      // Update order with payment information
      if (result.success) {
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            transaction_id: result.transactionId,
            status: data.method === "cash_on_delivery" ? "confirmed" : "paid",
          })
          .eq("id", data.orderId)

        // Create payment record
        await supabase.from("payments").insert({
          order_id: data.orderId,
          amount: data.amount,
          method: data.method,
          transaction_id: result.transactionId,
          status: "completed",
          phone_number: data.phoneNumber,
        })
      } else {
        await supabase
          .from("orders")
          .update({
            payment_status: "failed",
            status: "payment_failed",
          })
          .eq("id", data.orderId)

        // Create failed payment record
        await supabase.from("payments").insert({
          order_id: data.orderId,
          amount: data.amount,
          method: data.method,
          status: "failed",
          phone_number: data.phoneNumber,
          error_message: result.message,
        })
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur de paiement inconnue"
      toast.error(errorMessage)
      return {
        success: false,
        message: errorMessage,
      }
    } finally {
      setProcessing(false)
    }
  }

  // Get payment status
  const getPaymentStatus = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== "PGRST116") throw error
      return data
    } catch (error) {
      console.error("Error fetching payment status:", error)
      return null
    }
  }

  return {
    processing,
    processPayment,
    getPaymentStatus,
  }
}
