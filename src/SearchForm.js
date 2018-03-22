import React, { Component } from 'react'
import PropTypes from 'prop-types'
import difference from 'lodash.difference'

import TextField from './TextField.js'
import ConceptTypeToggle from './ConceptTypeToggle.js'
import MedicationSearchField from './MedicationSearchField.js'
import DateRangeField from './DateRangeField.js'
import Icon from './Icon.js'
import { paramsFromQuery, queryFromSearchObject } from './fhir/search.js'
import { isValidSctid } from './snomed/sctid.js'
import { snomedUri } from './snomed/core.js'
import { amtConceptTypes } from './fhir/medication.js'

import './css/SearchForm.css'

class SearchForm extends Component {
  static propTypes = {
    query: PropTypes.string,
    onSearchUpdate: PropTypes.func,
    onError: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.state = { search: {} }
    this.clearSearch = this.clearSearch.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleTypeChange = this.handleTypeChange.bind(this)
    this.handleStatusChange = this.handleStatusChange.bind(this)
    this.handleClear = this.handleClear.bind(this)
    this.handleSearchUpdate = this.handleSearchUpdate.bind(this)
    this.handleError = this.handleError.bind(this)
  }

  // Returns search path for populating the autocomplete on the ingredient
  // search.
  ingredientSearch(query) {
    return isValidSctid(query)
      ? `/Substance?code=${snomedUri}|${query}`
      : `/Substance?code:text=${query}`
  }

  // Returns search path for populating the autocomplete on the package item
  // search.
  packageItemSearch(query) {
    return isValidSctid(query)
      ? `/Medication?code=${snomedUri}|${query}`
      : `/Medication?medication-resource-type=BPSF,UPDSF&_text=${query}`
  }

  // Returns search path for populating the autocomplete on the parent search.
  parentOrAncestorSearch(query) {
    return isValidSctid(query)
      ? `/Medication?code=${snomedUri}|${query}`
      : `/Medication?medication-resource-type=BPG,brand,UPG,UPDSF,UPD&_text=${query}`
  }

  searchableConceptTypes() {
    return amtConceptTypes.filter(t => t !== 'substance' && t !== 'TP')
  }

  searchableConceptStatuses() {
    return ['active', 'inactive', 'entered-in-error']
  }

  clearSearch() {
    this.setState(() => ({ search: {} }), this.handleSearchUpdate)
  }

  handleChange(change) {
    const { search } = this.state
    this.setState(() => ({ search: { ...search, ...change } }))
  }

  handleCodingChange(param, value) {
    const { search } = this.state
    // Always nullify the corresponding text value when receiving a coding.
    const updatedSearch = {
      ...search,
      ...{ [param]: value, [`${param}-text`]: undefined },
    }
    this.setState(() => ({ search: updatedSearch }), this.handleSearchUpdate)
  }

  handleTypeChange(value) {
    if (difference(this.searchableConceptTypes(), value).length > 0)
      this.handleChange({ type: value.join(',') })
    else this.handleChange({ type: null })
  }

  handleStatusChange(value) {
    if (difference(this.searchableConceptStatuses(), value).length > 0)
      this.handleChange({ status: value.join(',') })
    else this.handleChange({ status: null })
  }

  handleClear(...params) {
    const { search } = this.state
    const updatedSearch = {}
    for (const param of params) {
      updatedSearch[param] = undefined
    }
    this.setState(
      () => ({ search: { ...search, ...updatedSearch } }),
      this.handleSearchUpdate,
    )
  }

  handleSearchUpdate(event) {
    const { onSearchUpdate } = this.props
    const { search } = this.state
    if (event) event.preventDefault()
    if (onSearchUpdate) {
      onSearchUpdate(queryFromSearchObject(search))
    }
  }

  handleError(error) {
    const { onError } = this.props
    if (onError) onError(error)
  }

  componentDidMount() {
    const { query } = this.props
    if (query) {
      const params = paramsFromQuery(query)
      let nextSearch = {}
      // Filter ID from the list of parameters taken into the search object, as
      // it is not in the form and it is not valid to combine it with any other
      // parameter.
      for (const param of params.allParams.filter(p => p[0] !== 'id')) {
        nextSearch = { ...nextSearch, ...{ [param[0]]: param[1] } }
      }
      this.setState(() => ({ search: nextSearch }))
    } else {
      this.setState(() => ({ search: {} }))
    }
  }

  componentWillReceiveProps(nextProps) {
    const { query } = nextProps
    if (query) {
      const params = paramsFromQuery(query)
      let nextSearch = {}
      for (const param of params.allParams) {
        nextSearch = { ...nextSearch, ...{ [param[0]]: param[1] } }
      }
      this.setState(() => ({ search: nextSearch }))
    }
  }

  render() {
    const { search } = this.state
    return (
      <form className="search-form">
        <TextField
          value={search.text}
          label="Contains text"
          onChange={value => this.handleChange({ text: value })}
          focusUponMount
        />
        <MedicationSearchField
          codingValue={search['ingredient']}
          textValue={search['ingredient-text']}
          label="Ingredient"
          searchPath={this.ingredientSearch}
          onCodingChange={value => this.handleCodingChange('ingredient', value)}
          onTextChange={value =>
            this.handleChange({ 'ingredient-text': value })
          }
          onClear={() => this.handleClear('ingredient', 'ingredient-text')}
          onError={this.handleError}
        />
        <MedicationSearchField
          codingValue={search['package']}
          textValue={search['package-text']}
          label="Package item"
          searchPath={this.packageItemSearch}
          onCodingChange={value => this.handleCodingChange('package', value)}
          onTextChange={value => this.handleChange({ 'package-text': value })}
          onClear={() => this.handleClear('package', 'package-text')}
          onError={this.handleError}
        />
        <TextField
          value={search['form-text']}
          label="Form"
          onChange={value => this.handleChange({ 'form-text': value })}
        />
        <TextField
          value={search['container-text']}
          label="Container"
          onChange={value => this.handleChange({ 'container-text': value })}
        />
        <TextField
          value={search['brand-text']}
          label="Brand"
          onChange={value => this.handleChange({ 'brand-text': value })}
        />
        <TextField
          value={search.pbs}
          label="PBS code"
          onChange={value => this.handleChange({ pbs: value })}
        />
        <TextField
          value={search.artg}
          label="ARTG ID"
          onChange={value => this.handleChange({ artg: value })}
        />
        <MedicationSearchField
          codingValue={search['parent']}
          textValue={search['parent-text']}
          label="Parent"
          searchPath={this.parentOrAncestorSearch}
          onCodingChange={value => this.handleCodingChange('parent', value)}
          onTextChange={value => this.handleChange({ 'parent-text': value })}
          onClear={() => this.handleClear('parent', 'parent-text')}
          onError={this.handleError}
        />
        <MedicationSearchField
          codingValue={search['ancestor']}
          textValue={search['ancestor-text']}
          label="Ancestor"
          searchPath={this.parentOrAncestorSearch}
          onCodingChange={value => this.handleCodingChange('ancestor', value)}
          onTextChange={value => this.handleChange({ 'ancestor-text': value })}
          onClear={() => this.handleClear('ancestor', 'ancestor-text')}
          onError={this.handleError}
        />
        <DateRangeField
          label="Last modified"
          startDate={search['modified-from']}
          endDate={search['modified-to']}
          onChange={value =>
            this.handleChange({
              'modified-from': value.startDate,
              'modified-to': value.endDate,
            })
          }
        />
        <ConceptTypeToggle
          types={this.searchableConceptTypes()}
          value={
            search.type ? search.type.split(',') : this.searchableConceptTypes()
          }
          label="Type"
          onChange={this.handleTypeChange}
        />
        <ConceptTypeToggle
          types={this.searchableConceptStatuses()}
          value={
            search.status
              ? search.status.split(',')
              : this.searchableConceptStatuses()
          }
          label="Status"
          onChange={this.handleStatusChange}
        />
        <a className="clear-form" onClick={this.clearSearch}>
          Clear all
        </a>
        <button
          className="search-submit"
          type="submit"
          onClick={this.handleSearchUpdate}
        >
          Search
          <Icon type="search" width={18} />
        </button>
      </form>
    )
  }
}

export default SearchForm
