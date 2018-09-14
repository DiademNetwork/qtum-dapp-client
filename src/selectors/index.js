import * as R from 'ramda'
import { createSelector } from 'reselect'
import sortByTime from '../helpers/sort-by-time'
import mapSort from '../helpers/map-sort'

// Facebook
export const getFacebookAnthenticationStatus = R.path(['facebook', 'authenticationStatus'])
export const getAllFacebookData = R.path(['facebook', 'data'])
export const getFacebook = name => createSelector([ getAllFacebookData ], R.prop(name))
export const getFacebookUserID = getFacebook('userID')
export const getFacebookPictureUrl = createSelector([ getFacebook('picture') ], R.path(['data', 'url']))
export const isFacebookAuthenticated = createSelector([ getFacebookAnthenticationStatus ], R.equals('succeeded'))

// Wallet
export const getAllWalletMeta = R.path(['wallet', 'meta'])
export const getAllWalletData = R.path(['wallet', 'data'])
export const getWalletStatus = R.path(['wallet', 'status'])
export const getWallet = name => createSelector([ getAllWalletData ], R.prop(name))
export const getWalletMeta = name => createSelector([ getAllWalletMeta ], R.prop(name))
export const isUserRegistered = createSelector([getWalletMeta('isUserRegistered')], R.equals(true))
export const getWalletAddress = getWallet('addrStr')
export const isWalletReady = createSelector([ getWalletStatus ], R.either(R.equals('restored'), R.equals('restoring-info-saved')))

// Transactions
export const getAllTransactionsData = R.path(['transactions', 'data'])
export const getAllTransactionsMeta = R.path(['transactions', 'meta'])
export const getTransactionsMeta = name => createSelector([getAllTransactionsMeta], R.prop(name))
export const getTransactionsCount = createSelector([getAllTransactionsData], R.length)
export const getSortedTransactions = createSelector([getAllTransactionsData], sortByTime.asc)

// Achievements
export const getAchievementCreateStatus = R.path(['achievements', 'createStatus'])
export const getAllAchievementsData = R.path(['achievements', 'data'])
export const getAllAchievementsMeta = R.path(['achievements', 'meta'])
export const getAchievementsMeta = name => createSelector([getAllAchievementsMeta], R.prop(name))
export const getAchievementsCount = createSelector([getAllAchievementsData], R.length)
export const getGroupedByWalletAchievements = createSelector([getAllAchievementsData], R.groupBy(R.prop('wallet')))
export const getAllAchievementsWallets = createSelector([getGroupedByWalletAchievements], R.keys)
export const getProcessedAchievements = createSelector([getGroupedByWalletAchievements], R.mapObjIndexed((groupedAchievement) => {
  let result = R.compose(
    R.forEach((item) => {
      result = R.assocPath([item.object, 'achievement'], item, result)
    }),
    R.curry(mapSort)({ key: 'object', previousKey: 'previousLink' }),
    (x) => { console.log(x); return x },
    R.filter(R.compose(
      R.anyPass([R.equals('create'), R.equals('update')]),
      R.prop('verb')
    ))
  )(groupedAchievement)

  R.compose(
    R.forEach((item) => {
      const matchingItemIndex = R.findIndex(R.propEq('object', item.object))(result)
      const existingVerbItems = R.pathOr([], [item.verb], result)
      result[matchingItemIndex] = R.assoc(item.verb, R.append(item, existingVerbItems), result[matchingItemIndex])
    }),
    R.filter(R.compose(
      R.anyPass([R.equals('confirm'), R.equals('support'), R.equals('deposit')]),
      R.prop('verb')
    ))
  )(groupedAchievement)
  return result
}))

export const getUsers = R.path(['users', 'data'])

// Mix
export const isFacebookAuthenticatedAndWalletReady = createSelector([ isFacebookAuthenticated, isWalletReady ], R.and)
export const previousLinkOfUserAchievementOrNull = createSelector([
  getWalletAddress,
  getAllAchievementsWallets,
  getProcessedAchievements
], (
  userWalletAddress,
  allAchievementsWallets,
  processedAchievements
) => {
  if (!R.contains(userWalletAddress, allAchievementsWallets)) {
    return null
  } else {
    const userAchievementsChain = R.prop(userWalletAddress, processedAchievements)
    const updates = R.filter(R.propEq('verb', 'update'), userAchievementsChain)
    if (R.length(updates) === 0) {
      return null
    }
    return R.compose(
      R.prop('previousLink'),
      R.head,
      R.takeLast(1)
    )(updates)
  }
})
export const canCreateOrUpdateAchievement = createSelector([isFacebookAuthenticated, isWalletReady, isUserRegistered], R.unapply(R.all(R.equals(true))))
