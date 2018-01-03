import React, { Component } from 'react'
import PropTypes from 'prop-types'
import http, { CancelToken } from 'axios'
import throttle from 'lodash.throttle'
import omit from 'lodash.omit'
import onClickOutside from 'react-onclickoutside'

import TextField from './TextField.js'
import QuickSearchResults from './QuickSearchResults.js'
import { sniffFormat } from './fhir/restApi'
import { getSubjectConcept, amtConceptTypeFor } from './fhir/medication.js'
import { displayOrCoding, codeDisplayFromCoding } from './fhir/search.js'
import { opOutcomeFromJsonResponse } from './fhir/core.js'

import './css/MedicationSearchField.css'

export class MedicationSearchField extends Component {
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
    this.handleClickOutside = this.handleClickOutside.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleClick = this.handleClick.bind(this)
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
      .then(parsed => this.addTextOptionToSearchResults(parsed, query))
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
    if (!bundle || bundle.total === 0) return { results: [] }
    return {
      bundle,
      results: bundle.entry
        .map(e => getSubjectConcept(e.resource))
        .map(result => ({ ...result, type: amtConceptTypeFor(result.type) })),
    }
  }

  async addTextOptionToSearchResults({ bundle, results }, query) {
    return { bundle, results: [{ type: 'text', query }].concat(results) }
  }

  handleFocus() {
    this.setState(() => ({ quickSearchOpen: true }))
  }

  handleClickOutside() {
    this.setState(() => ({ quickSearchOpen: false }))
  }

  handleKeyDown(event) {
    // Close the quick search if Escape is pressed.
    if (event.key === 'Escape') {
      this.setState(() => ({ quickSearchOpen: false }))
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const { results } = this.state,
        selectedIndex = results.findIndex(r => r.selected)
      if (event.key === 'ArrowDown') this.setState({ quickSearchOpen: true })
      let newSelection
      if (selectedIndex === -1) newSelection = 0
      else {
        newSelection =
          event.key === 'ArrowDown'
            ? Math.min(selectedIndex + 1, results.length - 1)
            : Math.max(selectedIndex - 1, 0)
      }
      this.setState(() => ({
        results: results.map(
          (r, i) =>
            i === newSelection ? { ...r, selected: true } : omit(r, 'selected')
        ),
      }))
    } else if (event.key === 'Enter') {
      const { results } = this.state,
        selectedResult = results.find(r => r.selected)
      if (selectedResult) this.handleSelectResult(selectedResult)
    }
  }

  handleClick() {
    this.setState(() => ({ quickSearchOpen: true }))
  }

  // TODO: Reset selection upon close of quick search.

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
          onClick={this.handleClick}
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

export default onClickOutside(MedicationSearchField)
