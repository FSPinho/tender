import React, {Component} from 'react'
import {StyleSheet} from 'react-native'
import {withTheme} from "../theme";
import {createStackNavigator, createMaterialTopTabNavigator} from "react-navigation";
import {Home, Topics} from "../screens";import LineIcon from 'react-native-vector-icons/SimpleLineIcons'
import Header from "./Header";
import Tabs from "./Tabs";

export const Routes = {
    Home: 'HOME',
    Loved: 'LOVED',
    Stats: 'STATS',
    Topics: 'TOPICS'
}

const Icon = ({focused, horizontal, tintColor, ...props}) => <LineIcon size={24} color={tintColor} {...props}/>

class RootNavigation extends Component {
    constructor(props) {
        super(props)

        const {theme} = this.props

        const tabOptions = {
            tabBarPosition: 'bottom',
            swipeEnabled: true,
            animationEnabled: true,
            lazy: false,
            tabBarComponent: props => <Tabs {...props}/>
        }

        const stackOptions = {
            header: (props) => <Header {...props}/>
        }

        this.Nav = createStackNavigator({
            [Routes.Home]: {
                screen: createMaterialTopTabNavigator({
                    [Routes.Home]: {
                        screen: createStackNavigator({
                            [Routes.Home]: {
                                screen: Home,
                                navigationOptions: {title: 'Estudar', ...stackOptions}
                            }
                        }),
                        navigationOptions: {
                            tabBarIcon: props => <Icon {...props} name={'graduation'}/>,
                            title: 'Estudar'
                        }
                    },
                    [Routes.Loved]: {
                        screen: createStackNavigator({
                            [Routes.Loved]: {
                                screen: Home,
                                navigationOptions: {title: 'Favoritos', ...stackOptions}
                            }
                        }),
                        navigationOptions: {
                            tabBarIcon: props => <Icon {...props} name={'heart'}/>,
                            title: 'Favoritos'
                        }
                    },
                    [Routes.Stats]: {
                        screen: createStackNavigator({
                            [Routes.Stats]: {
                                screen: Home,
                                navigationOptions: {title: 'Desempenho', ...stackOptions}
                            }
                        }),
                        navigationOptions: {
                            tabBarIcon: props => <Icon {...props} name={'graph'}/>,
                            title: 'Desempenho'
                        }
                    }
                }, tabOptions),
                navigationOptions: {header: null}
            },
            [Routes.Topics]: {
                screen: Topics,
                navigationOptions: ({navigation}) => ({
                    title: navigation.getParam('subject').t,
                    ...stackOptions
                })
            },
        }, {navigationOptions: stackOptions})
    }

    render() {
        return (<this.Nav/>)
    }
}
export default withTheme({}, RootNavigation)
