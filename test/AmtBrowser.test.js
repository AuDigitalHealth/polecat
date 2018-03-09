import React from 'react'
import { shallow } from 'enzyme'

import { AmtBrowser } from '../src/AmtBrowser.js'
import RemoteFhirMedication from '../src/RemoteFhirMedication.js'
import Search from '../src/Search.js'
import ErrorMessage from '../src/ErrorMessage.js'
import SourceCodeSystem from '../src/SourceCodeSystem.js'
import VisibilityFilter from '../src/VisibilityFilter'
import { amtConceptTypeFor } from '../src/fhir/medication'

describe('AmtBrowser', () => {
  const minimalProps = {
    resourceType: 'Medication',
    id: '1065531000168104',
    viewport: {},
  }

  const subjectConcept = {
    type: 'BPG',
    coding: [
      {
        system: 'http://snomed.info/sct',
        code: '813241000168107',
        display: 'Nuromol film-coated tablet, 24',
      },
    ],
    status: 'active',
    sourceCodeSystemUri: 'http://snomed.info/sct',
    sourceCodeSystemVersion:
      'http://snomed.info/sct?version=http%3A%2F%2Fsnomed.info%2Fsct%2F32506021000036107%2Fversion%2F20180131',
    focused: true,
  }

  it('should pass ID and resource type to RemoteFhirMedication', () => {
    const wrapper = shallow(<AmtBrowser {...minimalProps} />)
    // Find the RemoteFhirMedication component, and check the props passed to it.
    const rfm = wrapper.find(RemoteFhirMedication)
    expect(rfm.prop('resourceType')).toEqual(minimalProps.resourceType)
    expect(rfm.prop('id')).toEqual(minimalProps.id)
  })

  it('should update loading in search when notified', () => {
    const wrapper = shallow(<AmtBrowser {...minimalProps} />)
    // Find the Search component and make sure the loading is set to false.
    expect(wrapper.find(Search).prop('loading')).toBe(false)
    // Find the `onLoadingChange` callbacks passed to the RemoteFhirMedication
    // and Search components, and make sure they are the same function.
    const onLoadingChange = wrapper
        .find(RemoteFhirMedication)
        .prop('onLoadingChange'),
      onLoadingChange2 = wrapper.find(Search).prop('onLoadingChange')
    expect(onLoadingChange).toBe(onLoadingChange2)
    // Call the `onLoadingChange` callback with a value of true.
    onLoadingChange(true)
    // Check that a value of true has been passed to the `loading` prop of the
    // Search component.
    expect(wrapper.find(Search).prop('loading')).toBe(false)
  })

  describe('error handling', () => {
    it('should display ErrorMessage when error is reported', () => {
      const wrapper = shallow(<AmtBrowser {...minimalProps} />)
      // Find the `onError` callbacks passed to the RemoteFhirMedication and
      // Search components, and make sure they are the same function.
      const onError = wrapper.find(RemoteFhirMedication).prop('onError'),
        onError2 = wrapper.find(Search).prop('onError')
      expect(onError).toBe(onError2)
      // Call the `onError` callback with some error.
      const error = new Error('Some error occurred.')
      onError(error)
      wrapper.update()
      // Check that an ErrorMessage component has been rendered, and that the
      // error has been passed through.
      const errorMsg = wrapper.find(ErrorMessage)
      expect(errorMsg.exists()).toBe(true)
      expect(errorMsg.prop('error')).toBe(error)
    })

    it('should clear error when a new resource is requested', () => {
      const wrapper = shallow(<AmtBrowser {...minimalProps} />)
      // Find the `onError` callback.
      const onError = wrapper.find(RemoteFhirMedication).prop('onError')
      // Call the `onError` callback with some error.
      const error = new Error('Some error occurred.')
      onError(error)
      wrapper.update()
      // Check that an ErrorMessage component has been rendered.
      let errorMsg = wrapper.find(ErrorMessage)
      expect(errorMsg.exists()).toBe(true)
      // Send through a new ID prop.
      wrapper.setProps({ id: '19255011000036102' })
      // Check that the ErrorMessage has been cleared.
      errorMsg = wrapper.find(ErrorMessage)
      expect(errorMsg.exists()).toBe(false)
    })

    it('should clear error when a new search is requested', () => {
      const wrapper = shallow(<AmtBrowser {...minimalProps} />)
      // Find the `onError` callback.
      const onError = wrapper.find(RemoteFhirMedication).prop('onError')
      // Call the `onError` callback with some error.
      const error = new Error('Some error occurred.')
      onError(error)
      wrapper.update()
      // Check that an ErrorMessage component has been rendered.
      let errorMsg = wrapper.find(ErrorMessage)
      expect(errorMsg.exists()).toBe(true)
      // Send through a new ID prop.
      wrapper.setProps({ query: 'somatropin' })
      // Check that the ErrorMessage has been cleared.
      errorMsg = wrapper.find(ErrorMessage)
      expect(errorMsg.exists()).toBe(false)
    })

    it('should stop loading when an error is reported', () => {
      const wrapper = shallow(<AmtBrowser {...minimalProps} />)
      // Find the `onLoadingChange` callbacks passed to the RemoteFhirMedication
      // and Search components, and make sure they are the same function.
      const onLoadingChange = wrapper
        .find(RemoteFhirMedication)
        .prop('onLoadingChange')
      // Find the `onError` callback.
      const onError = wrapper.find(RemoteFhirMedication).prop('onError')
      // Call the `onLoadingChange` callback with a value of true.
      onLoadingChange(true)
      // Call the `onError` callback with some error.
      const error = new Error('Some error occurred.')
      onError(error)
      // Check that there is no error message displayed.
      const errorMsg = wrapper.find(ErrorMessage)
      expect(errorMsg.exists()).toBe(false)
    })
  })

  it('should display SourceCodeSystem on load of subject concept', () => {
    const wrapper = shallow(<AmtBrowser {...minimalProps} />)
    // Get the `onLoadSubjectConcept` handler passed to the RemoteFhirMedication component.
    const onLoadSubjectConcept = wrapper
      .find(RemoteFhirMedication)
      .prop('onLoadSubjectConcept')
    // Call the `onLoadSubjectConcept` handler with some concept data.
    onLoadSubjectConcept(subjectConcept)
    wrapper.update()
    // Check that a SourceCodeSystem component has been rendered, and that the
    // correct props have been passed to it.
    const sourceCodeSystem = wrapper.find(SourceCodeSystem)
    expect(sourceCodeSystem.exists()).toBe(true)
    expect(sourceCodeSystem.prop('uri')).toEqual(
      subjectConcept.sourceCodeSystemUri,
    )
    expect(sourceCodeSystem.prop('version')).toEqual(
      subjectConcept.sourceCodeSystemVersion,
    )
  })

  it('should display VisibilityFilter on load of subject concept', () => {
    const wrapper = shallow(<AmtBrowser {...minimalProps} />)
    // Get the `onLoadSubjectConcept` handler passed to the RemoteFhirMedication component.
    const onLoadSubjectConcept = wrapper
      .find(RemoteFhirMedication)
      .prop('onLoadSubjectConcept')
    // Call the `onLoadSubjectConcept` handler with some concept data.
    onLoadSubjectConcept(subjectConcept)
    wrapper.update()
    // Check that a VisibilityFilter component has been rendered, and that the
    // correct props have been passed to it.
    const visibilityFilter = wrapper.find(VisibilityFilter)
    expect(visibilityFilter.exists()).toBe(true)
    expect(visibilityFilter.prop('subjectConceptType')).toEqual(
      amtConceptTypeFor(subjectConcept.type),
    )
    expect(visibilityFilter.prop('subjectConceptStatus')).toEqual(
      subjectConcept.status,
    )
  })
})
