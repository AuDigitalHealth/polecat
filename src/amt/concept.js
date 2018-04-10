export const expandedConceptType = type => {
  return {
    CTPP: 'Containered Trade Product Pack',
    TPP: 'Trade Product Pack',
    TPUU: 'Trade Product Unit of Use',
    TP: 'Trade Product',
    MPP: 'Medicinal Product Pack',
    MPUU: 'Medicinal Product Unit of Use',
    MP: 'Medicinal Product',
    substance: 'Substance',
    active: 'Active',
    inactive: 'Inactive',
    'entered-in-error': 'Entered in error',
  }[type]
}

export const humanisedStatus = status => {
  return {
    active: 'Active',
    inactive: 'Inactive',
    'entered-in-error': 'Entered in error',
  }[status]
}

export const humanisedType = type => {
  return {
    CTPP: 'CTPP',
    TPP: 'TPP',
    TPUU: 'TPUU',
    TP: 'TP',
    MPP: 'MPP',
    MPUU: 'MPUU',
    MP: 'MP',
    substance: 'substance',
    active: 'active',
    inactive: 'inactive',
    'entered-in-error': 'entered in error',
  }[type]
}
