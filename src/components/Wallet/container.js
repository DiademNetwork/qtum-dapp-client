import { connect } from 'react-redux'
import {
  checkUserRegistration,
  displayNotification,
  recoverWallet,
  refreshWallet,
  updateWalletStatus,
  withdrawFromHotWallet
} from '../../actions'
import {
  isFacebookAuthenticated,
  getWallet,
  getWalletMeta,
  getWalletStatus
} from '../../selectors'

const mapStateToProps = (state) => ({
  address: getWallet('addrStr')(state),
  balance: getWallet('balance')(state),
  unconfirmedBalance: getWallet('unconfirmedBalance')(state),
  unconfirmedTxApperances: getWallet('unconfirmedTxApperances')(state),
  mnemonic: getWalletMeta('mnemonic')(state),
  privateKey: getWalletMeta('privateKey')(state),
  wallet: getWalletMeta('wallet')(state),
  walletStatus: getWalletStatus(state),
  isRegistrationPending: getWalletMeta('isRegistrationPending')(state),
  isFacebookAuthenticated: isFacebookAuthenticated(state)
})

const mapDispatchToProps = {
  checkUserRegistration,
  displayNotification,
  recoverWallet,
  refreshWallet,
  updateWalletStatus,
  withdrawFromHotWallet
}

export default WrappedComponent =>
  connect(mapStateToProps, mapDispatchToProps)(WrappedComponent)
