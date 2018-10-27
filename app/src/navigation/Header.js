import React, {Component} from 'react'
import {withTheme} from "../theme";
import {Header as RNHeader} from "react-navigation";
import IconButton from "../components/IconButton";

class Header extends Component {
    render() {
        const { scene, theme } = this.props;
        scene.descriptor.options.headerStyle = {
            ...scene.descriptor.options.headerStyle,
            backgroundColor: theme.palette.backgroundPrimary,
            elevation: 4
        }

        scene.descriptor.options.headerTintColor = theme.palette.backgroundPrimaryTextPrimary

        scene.descriptor.options.headerRight = (
            <IconButton
                onPress={theme.doToggleTheme}
                icon={theme.light ? 'weather-night' : 'weather-sunny'} iconComponent={'material-community'} flat/>
        )

        return (<RNHeader {...this.props} scene={scene}/>)
    }
}

export default withTheme({}, Header)
