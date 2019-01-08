import React, { Component } from 'react'
import { PropTypes as T } from 'prop-types'
import * as R from 'ramda'
import Card from '@material-ui/core/Card'
import CardHeader from '@material-ui/core/CardHeader'
import CardContent from '@material-ui/core/CardContent'
import CardActions from '@material-ui/core/CardActions'
import Typography from '@material-ui/core/Typography'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import Divider from '@material-ui/core/Divider'
import withContainer from './container'
import Confirm from './Confirm'
import Support from './Support'
import { withStyles } from '@material-ui/core/styles'
import Link from 'components/shared/Link'
import network from 'configurables/network'

const styles = (theme) => ({
  actions: {
    justifyContent: 'flex-end'
  },
  card: {
    padding: theme.spacing.unit
  },
  actionsButtons: {
    marginRight: theme.spacing.unit
  },
  iconButton: {
    color: theme.palette.secondary.light
  },
  link: {
    marginBottom: theme.spacing.unit
  },
  panelDetails: {
    flexDirection: 'column'
  }
})

class AchievementsChain extends Component {
  getUniqueUsersNamesFor = verb => R.compose(
    (list) => {
      const nameKey = verb === 'confirm' ? 'witnessName' : 'name'
      return R.compose(
        R.uniq,
        R.map(R.prop(nameKey))
      )(list)
    },
    R.propOr([], verb)
  )

  getTotalAmountFor = verb => R.compose(
    R.reduce(
      (acc, curr) => R.add(acc, R.prop('amount', curr)),
      0
    ),
    R.propOr([], verb)
  )

  render () {
    const {
      classes,
      currentAchievement,
      idx,
      pastAchievements,
      userID
    } = this.props
    const { actor: creatorID, name: creatorName, title, object } = currentAchievement

    const uniqConfirmatorsNames = this.getUniqueUsersNamesFor('confirm')(currentAchievement)
    const uniqSupportersNames = this.getUniqueUsersNamesFor('support')(currentAchievement)
    const uniqDepositorsNames = this.getUniqueUsersNamesFor('deposit')(currentAchievement)

    const confirmationsCount = R.length(uniqConfirmatorsNames)
    const supportsCount = R.length(uniqSupportersNames)
    const despositsCount = R.length(uniqDepositorsNames)

    const depositsTotalAmount = this.getTotalAmountFor('deposit')(currentAchievement) / 1e8
    const supportsTotalAmount = this.getTotalAmountFor('support')(currentAchievement) / 1e8

    const commonActionsButtonsProps = {
      creatorName,
      currentAchievement,
      className: classes.actionsButtons,
      idx,
      link: object,
      title
    }

    return [
      <Card
        className={classes.card}
        data-qa-id={`achievement-item-${idx}`}
        key="achievement-card"
      >
        <CardHeader title={[
          <Typography key="achievement-actor" variant="subheading" color="textSecondary">Last achievement of {creatorName}:</Typography>,
          <Typography key="achievement-title" variant="headline">{title}</Typography>
        ]} />
        <Divider />
        <CardContent>
          <Link
            className={classes.link}
            href={object}
            text={`View achievement post on ${network.name}`}
          />
          {confirmationsCount > 0 ? (
            <Typography variant="body1" color="textSecondary">
              It has been confirmed by {R.head(uniqConfirmatorsNames)}{confirmationsCount - 1 > 0 ? ` and ${confirmationsCount - 1} others` : ''}
            </Typography>
          ) : (
            <Typography variant="body1" color="textSecondary">
              No Diadem Network user confirmed it yet
            </Typography>
          )}
          {supportsCount > 0 &&
            <Typography variant="body1" color="textSecondary">
              It has been supported by {R.head(uniqSupportersNames)}{supportsCount - 1 > 0 ? ` and ${supportsCount - 1} others` : ''} for a total amount of {supportsTotalAmount} QTUM
            </Typography>
          }
          {despositsCount > 0 &&
            <Typography variant="body1" color="textSecondary">
              {R.head(uniqDepositorsNames)}{despositsCount - 1 > 0 ? ` and ${despositsCount - 1} others have` : ' has'} made a deposit for a total amount of {depositsTotalAmount} QTUM
            </Typography>
          }
        </CardContent>
        {creatorID !== userID ? (
          <CardActions
            className={classes.actions}
            disableActionSpacing
          >
            <Confirm
              {...commonActionsButtonsProps}
            />
            <Support
              {...commonActionsButtonsProps}
              confirmationsCount={confirmationsCount}
            />
          </CardActions>
        ) : (
          <CardActions
            className={classes.actions}
            disableActionSpacing
          >
            <Typography>This is your achievement</Typography>
          </CardActions>
        )}
      </Card>,
      pastAchievements.length > 0 && (
        <ExpansionPanel key={`achievement-previous-history-items`}>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Typography color="textSecondary">View past achievements of {creatorName}</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails className={classes.panelDetails}>
            {pastAchievements.map((achievement, idx) => {
              const { title, object } = achievement
              const confirmationsCount = R.length(this.getUniqueUsersNamesFor('confirm')(achievement))
              const supportsCount = R.length(this.getUniqueUsersNamesFor('support')(achievement))
              const despositsCount = R.length(this.getUniqueUsersNamesFor('deposit')(achievement))
              return [
                <Typography
                  color="textPrimary"
                  key={`${idx}-title`}
                  variant="subheading"
                >
                  {title}
                </Typography>,
                <Link
                  key={`${idx}-link`}
                  href={object}
                  text={`View achievement post on ${network.name}`}
                />,
                <Typography
                  color="textSecondary"
                  key={`${idx}-confirm-support-deposit`}
                  variant="subheading"
                  paragraph
                >
                  {`${confirmationsCount} confirmations, ${supportsCount} supports, ${despositsCount} deposits`}
                </Typography>
              ]
            })}
          </ExpansionPanelDetails>
        </ExpansionPanel>
      )
    ]
  }
}

AchievementsChain.propTypes = {
  classes: T.object,
  currentAchievement: T.object,
  idx: T.number,
  pastAchievements: T.array,
  userID: T.string
}

export default R.compose(
  withContainer,
  withStyles(styles)
)(AchievementsChain)