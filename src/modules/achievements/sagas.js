import { all, call, fork, put, select, take, takeLatest } from 'redux-saga/effects'
import ownT from './types'
import ownA from './actions'
import api from 'services/api'
import stream from 'services/stream'
import S from 'modules/selectors'
import T from 'modules/types'
import { eventChannel } from 'redux-saga'
import blockchains from 'configurables/blockchains'

const create = function * (payload) {
  try {
    const userAddress = yield select(S.wallets.primaryAddress)
    const { createAchievement } = blockchains.get(blockchains.primary.key)
    yield call(createAchievement, { ...payload, userAddress })
    yield put(ownA.create.succeeded())
  } catch (error) {
    yield put(ownA.create.errored({ error }))
  }
}

const confirm = function * (payload) {
  try {
    const userAddress = yield select(S.wallets.primaryAddress)
    const { confirmAchievement } = blockchains.get(blockchains.primary.key)
    yield call(confirmAchievement, { ...payload, userAddress })
    yield put(ownA.confirm.succeeded())
  } catch (error) {
    yield put(ownA.confirm.errored({ error }))
  }
}

const support = function * (payload) {
  try {
    const { blockchainKey } = payload
    const { supportAchievement } = blockchains.get(blockchainKey)
    const userAddress = yield select(S.wallets.primaryAddress)
    if (supportAchievement) {
      yield call(supportAchievement, { ...payload, userAddress })
    } else {
      yield call(supportProxified, { ...payload, userAddress })
    }
    yield put(ownA.support.succeeded())
  } catch (error) {
    yield put(ownA.support.errored({ error }))
  }
}

const supportProxified = function * ({ amount, blockchainKey, creatorAddress, fees, link, userAddress }) {
  try {
    const { address, encodedData } = yield call(api.prepareSupport(blockchainKey), {
      amount,
      creatorAddress,
      fees,
      userAddress
    })
    const signedRawTx = blockchains.get(blockchainKey).generateContractSendTx({
      address,
      encodedData,
      amount,
      feeRate: fees
    })
    const { newAmount } = yield call(api.supportAchievement(blockchainKey), {
      amount,
      userAddress,
      blockchain: blockchainKey,
      creatorAddress,
      link,
      signedRawTx
    })
    yield call(blockchains.get(blockchains.primary.key).supportAchievement, {
      creatorAddress,
      amount: newAmount,
      link
    })
  } catch (error) {
    yield put(ownA.support.errored({ error }))
  }
}

const fetch = function * ({ page }) {
  try {
    const { results: items, hasMore } = yield call(stream.fetchData, 'achievement_flat', 'common', page)
    yield put(ownA.fetch.succeeded({ list: items, hasMore }))
  } catch (error) {
    yield put(ownA.fetch.errored({ error }))
  }
}

const subscribe = function * () {
  let callbackObj = {}
  const channel = eventChannel(emitter => {
    callbackObj.call = emitter
    return () => {}
  })
  try {
    yield call(stream.subscribeWithCallBacks, 'achievement_flat', 'common', callbackObj.call)
    yield put(ownA.subscribe.succeeded())
    while (true) {
      yield take(channel)
      yield call(fetch)
      yield put(ownA.received())
    }
  } catch (error) {
    yield put(ownA.subscribe.errored({ error }))
  }
}

const fetchUserAchievements = function * ({ page }) {
  try {
    const userAddress = yield select(S.wallets.primaryAddress)
    const { results: items, hasMore } = yield call(stream.fetchData, 'achievement_flat', userAddress, page)
    yield put(ownA.fetchUser.succeeded({ list: items, hasMore }))
  } catch (error) {
    yield put(ownA.fetchUser.errored({ error }))
  }
}

const subscribeUserAchievements = function * ({ userAddress }) {
  let callbackObj = {}
  const channel = eventChannel(emitter => {
    callbackObj.call = emitter
    return () => {}
  })
  try {
    yield call(stream.subscribeWithCallBacks, 'achievement_flat', userAddress, callbackObj.call)
    yield put(ownA.subscribe.succeeded())
    while (true) {
      yield take(channel)
      yield call(fetchUserAchievements, { userAddress })
      yield put(ownA.receivedUser())
    }
  } catch (error) {
    yield put(ownA.subscribe.errored({ error }))
  }
}

export default function * () {
  yield all([
    fork(fetch, {}),
    fork(subscribe),
    takeLatest(T.wallets.CONNECT.succeeded, fetchUserAchievements),
    takeLatest(T.wallets.CONNECT.succeeded, fetch),
    takeLatest(T.wallets.GET_GETSTREAM_TOKEN.succeeded, fetchUserAchievements),
    takeLatest(T.wallets.GET_GETSTREAM_TOKEN.succeeded, subscribeUserAchievements),
    takeLatest(ownT.CREATE.requested, create),
    takeLatest(ownT.FETCH.requested, fetch),
    takeLatest(ownT.FETCH_USER.requested, fetchUserAchievements),
    takeLatest(ownT.CONFIRM.requested, confirm),
    takeLatest(ownT.SUPPORT.requested, support)
  ])
}
