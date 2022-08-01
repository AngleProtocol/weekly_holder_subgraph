import { Address, store, BigInt } from '@graphprotocol/graph-ts'
import { Holder } from '../../generated/schema'
import { Transfer } from '../../generated/Token/ERC20'

export function handleTransfer(event: Transfer): void {
  // Do nothing if the transfer is void
  if (event.params.value.equals(BigInt.fromString('0'))) return

  // Bind contracts
  const toId = event.params.to.toHexString() + '_' + event.address.toHexString()
  const fromId = event.params.from.toHexString() + '_' + event.address.toHexString()

  // Modify toId data point
  if (!event.params.to.equals(Address.fromString('0x0000000000000000000000000000000000000000'))) {
    let tempData: Holder | null
    let toData: Holder
    tempData = Holder.load(toId)
    if (tempData != null) {
      toData = new Holder(toId)
      toData.balance = event.params.value
    } else {
      toData = tempData as Holder
      toData.balance = toData.balance.plus(event.params.value)
    }
    toData.token = event.address.toHexString()
    toData.holder = event.params.to.toHexString()
    toData.week = BigInt.fromString('0')
    toData.save()
  }

  // Modify fromId data point
  if (!event.params.from.equals(Address.fromString('0x0000000000000000000000000000000000000000'))) {
    let fromData: Holder
    fromData = Holder.load(fromId) as Holder
    fromData.token = event.address.toHexString()
    fromData.holder = event.params.from.toHexString()
    let newBalance = fromData.balance.minus(event.params.value)
    if (newBalance.equals(BigInt.fromString('0'))) {
      store.remove('Holder', fromId)
    } else {
      fromData.balance = newBalance
      fromData.week = event.block.timestamp.div(BigInt.fromString((7 * 24 * 3600).toString()))
      fromData.save()
    }
  }
}
