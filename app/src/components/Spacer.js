import React from 'react';
import {View} from 'react-native';
import {withTheme} from '../theme';
import PropTypes from "prop-types";

class Spacer extends React.Component {

    render() {

        const {large, small, vertical, theme, ...props} = this.props

        return (<View style={{
            [vertical ? 'height' : 'width']: large ? theme.metrics.spacing * 4
                : small ? theme.metrics.spacing : theme.metrics.spacing * 2
        }} {...props} />)
    }
}

Spacer.propTypes = {
    large: PropTypes.bool,
    small: PropTypes.bool,
    vertical: PropTypes.bool,
}

export default withTheme({}, Spacer)