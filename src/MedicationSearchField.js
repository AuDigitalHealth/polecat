import React, { Component } from 'react'
import PropTypes from 'prop-types'
import http, { CancelToken } from 'axios'
import throttle from 'lodash.throttle'

import TextField from './TextField.js'
import QuickSearchResults from './QuickSearchResults.js'
import { sniffFormat } from './fhir/restApi'
import { getSubjectConcept, amtConceptTypeFor } from './fhir/medication.js'
import { displayOrCoding, codeDisplayFromCoding } from './fhir/search.js'
import { opOutcomeFromJsonResponse } from './fhir/core.js'

import './css/MedicationSearchField.css'

class MedicationSearchField extends Component {
  static propTypes = {
    fhirServer: PropTypes.string.isRequired,
    codingValue: PropTypes.string,
    textValue: PropTypes.string,
    searchPath: PropTypes.func.isRequired,
    onCodingChange: PropTypes.func,
    onTextChange: PropTypes.func,
    onClear: PropTypes.func,
    onError: PropTypes.func,
    label: PropTypes.string,
    focusUponMount: PropTypes.bool,
    minRequestFrequency: PropTypes.number,
  }
  static defaultProps = {
    minRequestFrequency: 350,
  }

  constructor(props) {
    super(props)
    this.state = { quickSearchOpen: false, loading: false }
    this.throttledQueryUpdate = throttle(
      this.throttledQueryUpdate.bind(this),
      props.minRequestFrequency
    )
    this.handleFocus = this.handleFocus.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleTextValueChange = this.handleTextValueChange.bind(this)
    this.handleSelectResult = this.handleSelectResult.bind(this)
    this.handleClear = this.handleClear.bind(this)
    this.handleError = this.handleError.bind(this)
  }

  throttledQueryUpdate(query) {
    const { fhirServer } = this.props
    this.setLoadingStatus(true)
    this.getSearchResultsFromQuery(fhirServer, query)
      .then(bundle => this.parseSearchResults(bundle))
      .then(parsed =>
        this.setState(() => ({
          bundle: parsed.bundle,
          results: parsed.results,
          cancelRequest: null,
          quickSearchOpen: true,
        }))
      )
      .then(() => this.setLoadingStatus(false))
      .catch(error => this.handleError(error))
  }

  setLoadingStatus(loading) {
    this.setState(() => ({ loading }))
  }

  async getSearchResultsFromQuery(fhirServer, query) {
    const { cancelRequest } = this.state
    let response, cancelToken
    try {
      if (cancelRequest) cancelRequest()
      response = await http.get(this.buildSearchPath(fhirServer, query), {
        headers: { Accept: 'application/fhir+json, application/json' },
        cancelToken: new CancelToken(function executor(c) {
          cancelToken = c
        }),
      })
      this.setState(() => ({ cancelRequest: cancelToken }))
    } catch (error) {
      if (error.response) this.handleUnsuccessfulResponse(error.response)
      else throw error
    }
    sniffFormat(response.headers['content-type'])
    return response.data
  }

  buildSearchPath(fhirServer, query) {
    const { searchPath } = this.props
    return `${fhirServer}${searchPath(query)}&_summary=true&_count=20`
  }

  async parseSearchResults(bundle) {
    if (!bundle || bundle.total === 0) return []
    return {
      bundle,
      results: bundle.entry
        .map(e => getSubjectConcept(e.resource))
        .map(result => ({ ...result, type: amtConceptTypeFor(result.type) })),
    }
  }

  handleFocus() {
    this.setState(() => ({ quickSearchOpen: true }))
  }

  handleKeyDown(event) {
    // Close the quick search if Escape is pressed.
    if (event.key === 'Escape') {
      this.setState(() => ({ quickSearchOpen: false }))
    }
  }

  handleTextValueChange(value) {
    const { onTextChange } = this.props
    if (onTextChange) onTextChange(value)
  }

  handleSelectResult(result) {
    const { onCodingChange, onTextChange } = this.props
    if (typeof result === 'string' && onTextChange) {
      onTextChange(result)
    } else if (onCodingChange && result.coding) {
      onCodingChange(codeDisplayFromCoding(result.coding))
    }
    this.setState(() => ({ quickSearchOpen: false }))
  }

  handleClear() {
    const { onClear } = this.props
    if (onClear) {
      onClear()
      this.setState({ bundle: null, results: null })
    }
  }

  handleUnsuccessfulResponse(response) {
    try {
      sniffFormat(response.headers['content-type'])
      const opOutcome = opOutcomeFromJsonResponse(response)
      if (opOutcome) throw opOutcome
    } catch (error) {}
    throw new Error(response.statusText || response.status)
  }

  handleError(error) {
    const { onError } = this.props
    if (onError) onError(error)
  }

  componentWillUnmount() {
    const { cancelRequest } = this.state
    if (cancelRequest) cancelRequest()
  }

  componentWillReceiveProps(nextProps) {
    const { textValue } = nextProps
    if (textValue && this.props.textValue !== textValue) {
      this.throttledQueryUpdate(textValue)
    }
  }

  render() {
    const { codingValue, textValue, label, focusUponMount } = this.props
    const { quickSearchOpen, query, results } = this.state

    return codingValue ? (
      this.renderCodingSelected()
    ) : (
      <div className='medication-search-field'>
        <TextField
          label={label}
          value={textValue}
          focusUponMount={focusUponMount}
          onChange={this.handleTextValueChange}
          onFocus={this.handleFocus}
          onKeyDown={this.handleKeyDown}
        />
        {quickSearchOpen ? (
          <QuickSearchResults
            query={query}
            results={results}
            onSelectResult={this.handleSelectResult}
          />
        ) : null}
      </div>
    )
  }

  renderCodingSelected() {
    const { codingValue, label } = this.props
    return (
      <div className='medication-search-field'>
        <label>
          {label}
          <div className='selected-code' title={codingValue}>
            {displayOrCoding(codingValue)}
            <div className='clear-code' onClick={this.handleClear}>
              &#735;
            </div>
          </div>
        </label>
      </div>
    )
  }
}

export default MedicationSearchField
