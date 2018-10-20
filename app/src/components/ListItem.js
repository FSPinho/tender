import React from 'react';
import {StyleSheet} from 'react-native';
import {withTheme} from '../theme';
import PropTypes from "prop-types";
import Box from "./Box";
import Text from "./Text";
import Spacer from "./Spacer";
import IconButton from "./IconButton";
import Touchable from "./Touchable";

class ListItem extends React.Component {

    shouldComponentUpdate(props) {
        const {theme: _, ...currentProps} = this.props
        const {theme: __, ...nextProps} = props
        return JSON.stringify(currentProps) !== JSON.stringify(nextProps)
    }

    render() {
        const {title, subtitle, text, favorite, theme, index, onPress, ...props} = this.props
        const {styles} = theme

        index === 0 && console.log('ListItem:render - Rendering:', title)

        return (
            <Box paper style={styles.root} {...props}>
                <Touchable primary onPress={onPress}>
                    <Box padding fit centralize>
                        <Box column fit>
                            <Text children={title} bold/>
                            {!!subtitle && <Text children={subtitle} secondary/>}
                            {!!text && <Text children={text}/>}
                        </Box>
                        <Spacer/>
                        <Box>
                            <IconButton icon={'heart'} iconComponent={'material-community'} primary={favorite}
                                        textColor={favorite ? theme.palette.primaryTextPrimary : theme.palette.backgroundPrimaryTextDisabled}
                                        flat={!favorite}/>
                        </Box>
                    </Box>
                </Touchable>
            </Box>
        )
    }
}

ListItem.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    text: PropTypes.string,
    favorite: PropTypes.bool,
    index: PropTypes.number,
    onPress: PropTypes.func
}

const styles = theme => StyleSheet.create({
    root: {
        marginLeft: theme.metrics.spacing * 2,
        marginRight: theme.metrics.spacing * 2,
        marginTop: theme.metrics.spacing,
        marginBottom: theme.metrics.spacing,
        overflow: 'hidden'
    }
})

export default withTheme(styles, ListItem)