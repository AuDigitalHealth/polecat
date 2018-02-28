import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import Icon from './Icon.js'
import Toggle from './Toggle.js'
import {
  visibilityConfig,
  configActions,
  configValueImplies,
} from './config.js'
import ConceptType from './ConceptType.js'

import './css/VisibilityFilter.css'

class VisibilityFilter extends Component {
  static propTypes = {
    subjectConceptType: PropTypes.oneOf([
      'CTPP',
      'TPP',
      'TPUU',
      'MPP',
      'MPUU',
      'MP',
      'substance',
    ]).isRequired,
    subjectConceptStatus: PropTypes.oneOf([
      'active',
      'inactive',
      'entered-in-error',
    ]).isRequired,
    // Config values brought in from global state.
    config: PropTypes.object.isRequired,
    // Config action to modify config in global state.
    setConfig: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.handleMenuToggle = this.handleMenuToggle.bind(this)
    this.state = { menuOpen: false }
  }

  handleOptionToggle(key) {
    const { config, setConfig, subjectConceptType } = this.props
    // Set the config value to the opposite of what it was, and additionally
    // check for futher implications and set those config values as well.
    setConfig({
      [key]: !config[key],
      ...configValueImplies(key, !config[key], subjectConceptType),
    })
  }

  handleMenuToggle() {
    const { menuOpen } = this.state
    this.setState(() => ({ menuOpen: !menuOpen }))
  }

  // Translate a configuration key into a human friendly label.
  humaniseConfig(key) {
    // Get the last component of the config key.
    key = key.split('.').slice(-1)[0]
    return (
      {
        parentOfMp: (
          <span title="Parent of MP">
            <ConceptType type="MP" title={null} />
            <Icon type="is-a" width={15} height={20} />
            <ConceptType type="MP" className="ghosted" title={null} />
          </span>
        ),
        mp: <ConceptType type="MP" />,
        parentOfMpuu: (
          <span title="Parent of MPUU">
            <ConceptType type="MPUU" title={null} />
            <Icon type="is-a" width={15} height={20} />
            <ConceptType type="MPUU" className="ghosted" title={null} />
          </span>
        ),
        mpuu: <ConceptType type="MPUU" />,
        parentOfMpp: (
          <span title="Parent of MPP">
            <ConceptType type="MPP" title={null} />
            <Icon type="is-a" width={15} height={20} />
            <ConceptType type="MPP" className="ghosted" title={null} />
          </span>
        ),
        mpp: <ConceptType type="MPP" />,
        tp: <ConceptType type="TP" />,
        tpuu: <ConceptType type="TPUU" />,
        tpp: <ConceptType type="TPP" />,
        ctpp: <ConceptType type="CTPP" />,
        componentPack: 'Component packs',
        replaces: 'Replaced concepts',
        substance: <ConceptType type="substance" />,
        hideAllExceptReplacedBy: 'Show only replacements',
      }[key] || key
    )
  }

  render() {
    const { menuOpen } = this.state
    return (
      <div className="visibility-filter">
        <Icon
          type="eye"
          width={40}
          height={40}
          alt="Visibility settings"
          title="Visibility settings"
          className={
            menuOpen
              ? 'visibility-filter-icon active'
              : 'visibility-filter-icon'
          }
          onClick={this.handleMenuToggle}
        />
        {menuOpen ? this.renderOptions() : null}
      </div>
    )
  }

  renderOptions() {
    const { config } = this.props,
      options = Object.keys(config).map(k => (
        <li key={k}>
          <label onClick={() => this.handleOptionToggle(k)}>
            {this.humaniseConfig(k)}
          </label>
          <Toggle
            value={config[k]}
            onClick={() => this.handleOptionToggle(k)}
          />
        </li>
      ))
    return <ol className="visibility-filter-options">{options}</ol>
  }
}

// Select the configuration parameters applicable to the subject concept, based
// on type and status.
const visibilityConfigFromProps = (state, props) => {
  const { subjectConceptType } = props,
    subjectConceptStatus =
      props.subjectConceptStatus === 'active'
        ? props.subjectConceptStatus
        : 'inactive',
    config = {}
  // Visibility settings follow the convention:
  // `visibility.[subject concept type].[filtered concept type]
  const keys = Object.keys(visibilityConfig).filter(k =>
    k.match(
      `visibility\\.(${subjectConceptType.toLowerCase()}|${subjectConceptStatus})\\.\\w+`,
    ),
  )
  const notReplacedByKey = 'visibility.inactive.hideAllExceptReplacedBy',
    notReplacedByPresent = config[notReplacedByKey]
  for (const key of keys) {
    config[key] =
      notReplacedByPresent && key !== notReplacedByKey ? false : state[key]
  }
  return config
}

const mapStateToProps = (state, ownProps) => ({
  config: visibilityConfigFromProps(state, ownProps),
})

export default connect(mapStateToProps, configActions)(VisibilityFilter)
