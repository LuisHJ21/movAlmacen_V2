import { axiosClient } from '@/api/axiosClient'
import type { ApiTransferPalletResponse, TransferPalletRequest } from '@/interfaces/transferPallet.interface'

export const transferPalletService = {
  async create(payload: TransferPalletRequest): Promise<void> {
    const { data } = await axiosClient.post<ApiTransferPalletResponse>('/transferPallet', payload)
    if (!data?.success) throw new Error(data?.message ?? 'No fue posible registrar la transferencia')
  },
}
