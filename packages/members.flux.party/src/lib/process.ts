/**
 * Functions which process data go here
 */


import * as R from 'ramda'

export const extractProps = (props) => (row) => R.props(props, row)
