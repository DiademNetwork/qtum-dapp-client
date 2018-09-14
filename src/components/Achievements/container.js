import { connect } from 'react-redux'
import {
  createAchievement,
  updateAchievement,
  updateAchievementsMeta
} from '../../actions'
import {
  canUserConfirmCreateUpdateSupportDeposit,
  getProcessedAchievements,
  previousLinkOfUserAchievementOrNull,
  getAchievementCreateStatus
} from '../../selectors'

const mapStateToProps = (state) => ({
  createAchievementStatus: getAchievementCreateStatus(state),
  achievements: getProcessedAchievements(state),
  canUserConfirmCreateUpdateSupportDeposit: canUserConfirmCreateUpdateSupportDeposit(state),
  previousLinkOfUserAchievementOrNull: previousLinkOfUserAchievementOrNull(state)
})

const mapDispatchToProps = {
  createAchievement,
  updateAchievement,
  updateAchievementsMeta
}

export default WrappedComponent =>
  connect(mapStateToProps, mapDispatchToProps)(WrappedComponent)
