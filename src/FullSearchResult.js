import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import ConceptType from './ConceptType.js'
import { codingToSnomedCode, codingToSnomedDisplay } from './fhir/medication.js'

class FullSearchResult extends Component {
  static propTypes = {
    result: PropTypes.shape({
      coding: PropTypes.arrayOf(
        PropTypes.shape({
          system: PropTypes.string,
          code: PropTypes.string,
          display: PropTypes.string,
        }),
      ),
      display: PropTypes.string,
      type: PropTypes.oneOf([
        'CTPP',
        'TPP',
        'TPUU',
        'TP',
        'MPP',
        'MPUU',
        'MP',
        'substance',
      ]),
      generalizedMedicines: PropTypes.arrayOf(
        PropTypes.shape({
          coding: PropTypes.arrayOf(
            PropTypes.shape({
              system: PropTypes.string,
              code: PropTypes.string,
              display: PropTypes.string,
            }),
          ),
          type: PropTypes.oneOf(['TPP', 'MPP', 'MPUU', 'MP']),
        }),
      ).isRequired,
      link: PropTypes.string.isRequired,
    }),
    style: PropTypes.object,
    allResultsAreOfType: PropTypes.string,
    shownGMs: PropTypes.arrayOf(PropTypes.oneOf(['TPP', 'MPP', 'MPUU', 'MP']))
      .isRequired,
    onSelectResult: PropTypes.func,
  }

  render() {
    const { result, allResultsAreOfType, style, onSelectResult } = this.props
    if (!result) {
      const displayLength = 189 + Math.round(Math.random() * 200)
      return (
        <li className="unloaded-search-result" style={style}>
          <span className="sctid" />
          <span className="display" style={{ width: displayLength }} />
        </li>
      )
    }
    return (
      <li className="search-result" style={style}>
        <Link
          to={result.link}
          className="subject-concept"
          onClick={() => onSelectResult(result)}
        >
          <span className="sctid">{codingToSnomedCode(result.coding)}</span>
          <span
            className="display"
            title={codingToSnomedDisplay(result.coding)}
          >
            {codingToSnomedDisplay(result.coding)}
          </span>
          {allResultsAreOfType ? null : (
            <ConceptType type={result.type} status={result.status} />
          )}
        </Link>
        {this.renderGMsForResult(result)}
      </li>
    )
  }

  renderGMsForResult(result) {
    const { shownGMs, onSelectResult } = this.props
    return shownGMs.map(gm => {
      const foundGM = result.generalizedMedicines.find(m => m.type === gm)
      return foundGM ? (
        <Link
          to={foundGM.link}
          key={gm}
          className="generalized-medicine"
          title={codingToSnomedDisplay(foundGM.coding)}
          onClick={() => onSelectResult(foundGM)}
        >
          {codingToSnomedDisplay(foundGM.coding)}
        </Link>
      ) : null
    })
  }
}

export default FullSearchResult
