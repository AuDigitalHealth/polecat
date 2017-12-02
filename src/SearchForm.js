import React, { Component } from 'react'
import PropTypes from 'prop-types'

import TextField from './TextField.js'
import ConceptTypeToggle from './ConceptTypeToggle.js'
import MedicationSearchField from './MedicationSearchField.js'
import {
  availableMedParams,
  availableSubstanceParams,
  extractSearchParams,
  extractQueryText,
  queryFromSearchObject,
} from './fhir/search.js'

import './css/SearchForm.css'

class SearchForm extends Component {
  static propTypes = {
    fhirServer: PropTypes.string.isRequired,
    query: PropTypes.string,
    onSearchUpdate: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.state = { search: {} }
    this.handleChange = this.handleChange.bind(this)
    this.handleClear = this.handleClear.bind(this)
    this.handleSearchUpdate = this.handleSearchUpdate.bind(this)
  }

  handleChange(param, value) {
    const { search } = this.state
    const updatedSearch = { ...search, ...{ [param]: value } }
    this.setState(() => ({ search: updatedSearch }))
  }

  handleCodingChange(param, value) {
    const { search } = this.state
    // Always nullify the corresponding text value when receiving a coding.
    const updatedSearch = {
      ...search,
      ...{ [param]: value, [`${param}-text`]: undefined },
    }
    this.setState(() => ({ search: updatedSearch }))
  }

  handleClear(...params) {
    const { search } = this.state
    const updatedSearch = {}
    for (const param of params) {
      updatedSearch[param] = undefined
    }
    this.setState(() => ({ search: { ...search, ...updatedSearch } }))
  }

  handleSearchUpdate(event) {
    const { onSearchUpdate } = this.props
    const { search } = this.state
    event.preventDefault()
    if (onSearchUpdate) {
      onSearchUpdate(queryFromSearchObject(search))
    }
  }

  componentDidMount() {
    const { query } = this.props
    if (query) {
      const availableParams = availableMedParams.concat(
          availableSubstanceParams
        ),
        searchParams = extractSearchParams(query, availableParams),
        queryText = extractQueryText(query)
      let nextSearch = {}
      for (const param of searchParams) {
        nextSearch = { ...nextSearch, ...{ [param[0]]: param[1] } }
      }
      if (queryText && queryText[queryText.length - 1] !== ':') {
        nextSearch.text = queryText
      }
      this.setState(() => ({ search: nextSearch }))
    } else {
      this.setState(() => ({ search: {} }))
    }
  }

  componentWillReceiveProps(nextProps) {
    const { query } = nextProps
    if (query) {
      const availableParams = availableMedParams.concat(
          availableSubstanceParams
        ),
        searchParams = extractSearchParams(query, availableParams),
        queryText = extractQueryText(query)
      let nextSearch = {}
      for (const param of searchParams) {
        nextSearch = { ...nextSearch, ...{ [param[0]]: param[1] } }
      }
      if (queryText && queryText[queryText.length - 1] !== ':') {
        nextSearch.text = queryText
      }
      this.setState(() => ({ search: nextSearch }))
    } else {
      this.setState(() => ({ search: {} }))
    }
  }

  render() {
    const { fhirServer } = this.props
    const { search } = this.state
    return (
      <form className='search-form'>
        <TextField
          value={search.text}
          label='Contains text'
          onChange={value => this.handleChange('text', value)}
          focusUponMount
        />
        <MedicationSearchField
          fhirServer={fhirServer}
          codingValue={search['ingredient']}
          textValue={search['ingredient-text']}
          label='Ingredient'
          searchPath={text => `/Substance?code:text=${text}`}
          onCodingChange={value => this.handleCodingChange('ingredient', value)}
          onTextChange={value => this.handleChange('ingredient-text', value)}
          onClear={() => this.handleClear('ingredient', 'ingredient-text')}
        />
        <TextField
          value={search['form-text']}
          label='Form'
          onChange={value => this.handleChange('form-text', value)}
        />
        <TextField
          value={search['container-text']}
          label='Container'
          onChange={value => this.handleChange('container-text', value)}
        />
        <TextField
          value={search['brand-text']}
          label='Brand'
          onChange={value => this.handleChange('brand-text', value)}
        />
        <TextField
          value={search.pbs}
          label='PBS code'
          onChange={value => this.handleChange('pbs', value)}
        />
        <TextField
          value={search.artg}
          label='ARTG ID'
          onChange={value => this.handleChange('artg', value)}
        />
        <TextField
          value={search['parent-text']}
          label='Parent'
          onChange={value => this.handleChange('parent-text', value)}
        />
        <ConceptTypeToggle
          value={search.type ? search.type.split(',') : null}
          label='Include only'
          onChange={value => this.handleChange('type', value.join(','))}
        />
        <button
          className='search-submit'
          type='submit'
          onClick={this.handleSearchUpdate}
        >
          Search
        </button>
      </form>
    )
  }
}

export default SearchForm
